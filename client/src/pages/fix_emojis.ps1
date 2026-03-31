# Fix mojibake emoji characters in AdminDashboard.jsx
# The file is saved as UTF-8 but was edited as if Latin-1, producing garbled emoji sequences

$filePath = "AdminDashboard.jsx"

# Read raw bytes and decode as UTF-8
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Map of corrupted sequences -> correct emoji
# These are the UTF-8 bytes of each 4-byte emoji decoded as Latin-1 / Windows-1252
$replacements = @{
    # ðŸ'¥ = 👥 U+1F465 (two people)
    "ðŸ'¥" = [System.Char]::ConvertFromUtf32(0x1F465)
    # ðŸ" = 📝 U+1F4DD (memo)
    "ðŸ"" = [System.Char]::ConvertFromUtf32(0x1F4DD)
    # ðŸŽ" = 🎓 U+1F393 (graduation cap)
    "ðŸŽ"" = [System.Char]::ConvertFromUtf32(0x1F393)
    # ðŸ¦ = 💼 U+1F4BC (briefcase)
    "ðŸ¦" = [System.Char]::ConvertFromUtf32(0x1F4BC)
    # ðŸŽ = 🎉 U+1F389 (party popper) 
    "ðŸŽ" = [System.Char]::ConvertFromUtf32(0x1F389)
    # ðŸŽ¨ = 🎨 U+1F3A8 (artist palette)
    "ðŸŽ¨" = [System.Char]::ConvertFromUtf32(0x1F3A8)
    # ðŸ"± = 📱 U+1F4F1 (mobile phone)
    "ðŸ"±" = [System.Char]::ConvertFromUtf32(0x1F4F1)
    # ðŸ'» = 💻 U+1F4BB (laptop)
    "ðŸ'»" = [System.Char]::ConvertFromUtf32(0x1F4BB)
    # ðŸ"¸ = 📸 U+1F4F8 (camera with flash) 
    "ðŸ"¸" = [System.Char]::ConvertFromUtf32(0x1F4F8)
    # ðŸŽ¬ = 🎬 U+1F3AC (clapper board)
    "ðŸŽ¬" = [System.Char]::ConvertFromUtf32(0x1F3AC)
    # ðŸ"„ = 📄 U+1F4C4 (page facing up)
    "ðŸ"„" = [System.Char]::ConvertFromUtf32(0x1F4C4)
    # ðŸ"š = 📚 U+1F4DA (books)
    "ðŸ"š" = [System.Char]::ConvertFromUtf32(0x1F4DA)
}

$newContent = $content
foreach ($pair in $replacements.GetEnumerator()) {
    $newContent = $newContent.Replace($pair.Key, $pair.Value)
}

if ($newContent -ne $content) {
    [System.IO.File]::WriteAllText($filePath, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "SUCCESS: Replaced corrupted emoji characters and saved file as UTF-8"
} else {
    Write-Host "No changes were made - strings may not have matched exactly"
}
