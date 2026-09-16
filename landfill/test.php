<?php
// Disabled in the public static demo. Scheduling runs on fictional browser-local data.
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
echo json_encode(['success' => false, 'error' => 'Server operations are disabled in this static demo.']);
exit;
