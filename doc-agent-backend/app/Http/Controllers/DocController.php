<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DocController extends Controller
{
    protected string $difyApiUrl;
    protected string $difyAppKey;
    protected string $difyBaseUrl;

    public function __construct()
    {
        $this->difyApiUrl = config('services.dify.url', '');
        $this->difyAppKey = config('services.dify.key', '');
        $this->difyBaseUrl = $this->resolveBaseUrl();

        Log::info('DocController: initialized', [
            'dify_configured' => !empty($this->difyApiUrl) && !empty($this->difyAppKey),
            'dify_base_url' => $this->difyBaseUrl,
        ]);
    }

    private function resolveBaseUrl(): string
    {
        $base = rtrim(config('services.dify.base_url', ''), '/');
        if ($base) {
            return $base;
        }
        $parsed = parse_url($this->difyApiUrl);
        if ($parsed && isset($parsed['scheme'], $parsed['host'])) {
            $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
            return $parsed['scheme'] . '://' . $parsed['host'] . $port;
        }
        return '';
    }

    public function generate(Request $request): JsonResponse
    {
        $user = $request->attributes->get('jwt_user');
        $userId = $user->sub ?? 'unknown';

        $request->validate([
            'prompt' => 'required|string',
            'doc_type' => 'nullable|string',
            'conversation_id' => 'nullable|string',
            'file' => 'nullable|file|max:10240|mimes:txt,docx,pdf',
        ]);

        $prompt = $request->input('prompt');
        $docType = $request->input('doc_type', 'generic');
        $conversationId = $request->input('conversation_id', '');

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileContent = $this->extractFileContent($file);

            if ($fileContent !== null && trim($fileContent) !== '') {
                Log::info('Doc: generate with file', [
                    'user_id' => $userId,
                    'filename' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'content_length' => mb_strlen($fileContent),
                    'instruction' => $prompt,
                ]);

                $prompt = $this->buildFileEditPrompt($fileContent, $prompt, $file->getClientOriginalName());
                $docType = 'generic';
            } else {
                Log::warning('Doc: file content extraction returned empty or null', [
                    'file_size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'ext' => $file->getClientOriginalExtension(),
                ]);
            }
        }

        Log::info('Doc: generate request', [
            'user_id' => $userId,
            'doc_type' => $docType,
            'prompt_length' => mb_strlen($prompt),
            'has_conversation_id' => !empty($conversationId),
        ]);

        return $this->callDifyWorkflow([
            'prompt' => $prompt,
            'doc_type' => $docType,
        ], $conversationId, $userId);
    }

    public function upload(Request $request): JsonResponse
    {
        $user = $request->attributes->get('jwt_user');
        $userId = $user->sub ?? 'unknown';

        $request->validate([
            'file' => 'required|file|max:10240|mimes:txt,docx,pdf',
            'prompt' => 'required|string',
            'conversation_id' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $instruction = $request->input('prompt');

        Log::info('Doc: upload request', [
            'user_id' => $userId,
            'filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'instruction' => $instruction,
        ]);

        $fileContent = $this->extractFileContent($file);
        if ($fileContent === null || trim($fileContent) === '') {
            return response()->json([
                'reply' => 'Could not read the uploaded file. Supported formats: .txt, .docx, .pdf',
                'source' => 'error',
            ], 422);
        }

        Log::info('Doc: file content extracted', [
            'content_length' => mb_strlen($fileContent),
            'content_preview' => mb_substr($fileContent, 0, 200),
        ]);

        $prompt = $this->buildFileEditPrompt($fileContent, $instruction, $file->getClientOriginalName());

        return $this->callDifyWorkflow([
            'prompt' => $prompt,
            'doc_type' => 'generic',
        ], $request->input('conversation_id', ''), $userId);
    }

    public function templates(): JsonResponse
    {
        $templates = config('templates.list', []);
        return response()->json(['templates' => $templates]);
    }

    public function generateFromTemplate(Request $request): JsonResponse
    {
        $user = $request->attributes->get('jwt_user');
        $userId = $user->sub ?? 'unknown';

        $validated = $request->validate([
            'template_id' => 'required|string',
            'details' => 'nullable|string',
            'conversation_id' => 'nullable|string',
        ]);

        $templates = config('templates.list', []);
        $template = collect($templates)->firstWhere('id', $validated['template_id']);

        if (!$template) {
            return response()->json([
                'reply' => 'Template not found.',
                'source' => 'error',
            ], 404);
        }

        $prompt = $template['prompt'];
        if (!empty($validated['details'])) {
            $prompt .= "\n\nAdditional details: " . $validated['details'];
        }

        Log::info('Doc: generateFromTemplate', [
            'user_id' => $userId,
            'template_id' => $validated['template_id'],
            'template_name' => $template['name'],
        ]);

        return $this->callDifyWorkflow([
            'prompt' => $prompt,
            'doc_type' => $template['doc_type'] ?? $template['id'],
            'template_id' => $validated['template_id'],
        ], $validated['conversation_id'] ?? '', $userId);
    }

    private function buildFileEditPrompt(string $fileContent, string $instruction, string $filename): string
    {
        return <<<PROMPT
You are a document editing assistant. Below is the content of a document file named "{$filename}".

=== DOCUMENT CONTENT START ===
{$fileContent}
=== DOCUMENT CONTENT END ===

TASK: {$instruction}

Please return ONLY the improved/modified document content. Do not include explanations, comments, or meta-commentary. Output the full modified document.
PROMPT;
    }

    private function callDifyWorkflow(array $inputs, ?string $conversationId, string $userId): JsonResponse
    {
        $conversationId = (string) ($conversationId ?? '');
        if (!$this->difyApiUrl || !$this->difyAppKey) {
            Log::warning('Doc: Dify not configured');
            return response()->json([
                'reply' => 'Document generation is not configured.',
                'source' => 'fallback',
            ]);
        }

        try {
            $payload = [
                'inputs' => $inputs,
                'response_mode' => 'blocking',
                'user' => $userId,
            ];

            if (!empty($conversationId)) {
                $payload['conversation_id'] = $conversationId;
            }

            Log::info('Doc: calling Dify workflow', [
                'input_keys' => array_keys($inputs),
                'prompt_length' => mb_strlen($inputs['prompt'] ?? ''),
            ]);

            $response = Http::timeout(120)->withHeaders([
                'Authorization' => 'Bearer ' . $this->difyAppKey,
                'Content-Type' => 'application/json',
            ])->post($this->difyApiUrl, $payload);

            Log::info('Doc: Dify response status', ['status' => $response->status()]);

            if (!$response->successful()) {
                Log::error('Doc: Dify API returned error', [
                    'status' => $response->status(),
                    'body_preview' => mb_substr($response->body(), 0, 1000),
                ]);
                return response()->json([
                    'reply' => 'AI service returned an error. Please try again later.',
                    'source' => 'error',
                ], 502);
            }

            $result = $response->json();

            if (!$result || !is_array($result)) {
                Log::error('Doc: Dify returned non-JSON response', [
                    'body_preview' => mb_substr($response->body(), 0, 500),
                ]);
                return response()->json([
                    'reply' => 'Document generation failed. The AI service returned an invalid response.',
                    'source' => 'error',
                ], 502);
            }

            $data = $result['data'] ?? $result;
            $outputs = $data['outputs'] ?? [];
            $status = $data['status'] ?? ($result['status'] ?? 'unknown');

            Log::info('Doc: Dify response parsed', [
                'status' => $status,
                'output_keys' => is_array($outputs) ? array_keys($outputs) : 'not_array',
            ]);

            if ($status === 'failed' || !empty($data['error'])) {
                Log::error('Doc: Dify workflow failed', [
                    'error' => $data['error'] ?? 'Unknown error',
                ]);
                return response()->json([
                    'reply' => 'The AI workflow failed. Error: ' . ($data['error'] ?? 'Unknown'),
                    'source' => 'error',
                ], 502);
            }

            $reply = $this->extractReplyFromOutputs($outputs, $data);

            $reply = preg_replace('/<think>[\s\S]*?<\/think>/', '', $reply);
            $reply = trim($reply);

            if (empty($reply)) {
                Log::warning('Doc: empty reply extracted', [
                    'outputs' => json_encode($outputs),
                    'data_keys' => array_keys($data),
                ]);
                return response()->json([
                    'reply' => 'The AI did not generate any output. Please try again with a different prompt.',
                    'source' => 'error',
                ]);
            }

            Log::info('Doc: generation successful', [
                'reply_length' => mb_strlen($reply),
            ]);

            return response()->json([
                'reply' => $reply,
                'source' => 'dify',
                'conversation_id' => $result['conversation_id'] ?? $data['conversation_id'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('Doc: Dify call exception', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
            ]);
            return response()->json([
                'reply' => 'Error generating document: ' . $e->getMessage(),
                'source' => 'error',
            ], 500);
        }
    }

    private function extractReplyFromOutputs($outputs, array $data): string
    {
        if (is_string($outputs)) {
            return $outputs;
        }

        if (is_array($outputs)) {
            $knownKeys = ['text', 'reply', 'output', 'result', 'content', 'message'];
            foreach ($knownKeys as $key) {
                if (!empty($outputs[$key]) && is_string($outputs[$key]) && mb_strlen(trim($outputs[$key])) > 10) {
                    return $outputs[$key];
                }
            }

            $longest = '';
            foreach ($outputs as $value) {
                if (is_string($value) && mb_strlen(trim($value)) > mb_strlen($longest)) {
                    $longest = trim($value);
                }
            }
            if (mb_strlen($longest) > 20) {
                return $longest;
            }
        }

        foreach (['answer', 'text', 'reply', 'output', 'result', 'content'] as $key) {
            if (!empty($data[$key]) && is_string($data[$key]) && mb_strlen(trim($data[$key])) > 10) {
                return $data[$key];
            }
        }

        return '';
    }

    private function extractFileContent($file): ?string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        try {
            return match ($extension) {
                'txt' => file_get_contents($path),
                'docx' => $this->extractDocxContent($path),
                'pdf' => $this->extractPdfContent($path),
                default => null,
            };
        } catch (\Exception $e) {
            Log::error('Doc: file extraction failed', [
                'extension' => $extension,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function extractDocxContent(string $path): ?string
    {
        if (!class_exists('ZipArchive')) {
            Log::warning('Doc: ZipArchive PHP extension not available — cannot extract .docx files');
            return null;
        }

        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            return null;
        }

        $content = $zip->getFromName('word/document.xml');
        $zip->close();

        if (!$content) {
            return null;
        }

        $content = strip_tags($content);
        $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $content = preg_replace('/\s+/', ' ', $content);
        return trim($content);
    }

    private function extractPdfContent(string $path): ?string
    {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($path);
            $text = $pdf->getText();
            $text = preg_replace('/\s+/', ' ', $text);
            $text = trim($text);
            return $text !== '' ? $text : null;
        } catch (\Exception $e) {
            Log::error('Doc: PDF extraction failed', [
                'error' => $e->getMessage(),
                'path' => $path,
            ]);
            return null;
        }
    }
}
