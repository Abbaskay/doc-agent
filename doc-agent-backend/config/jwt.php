<?php

return [
    'secret' => env('JWT_SECRET'),
    'cookie' => env('JWT_COOKIE', 'super_agent_token'),
    'algorithm' => 'HS256',
];
