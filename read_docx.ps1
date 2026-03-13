Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('c:\Users\sitek\Documents\Project\ВЕТАИ\TZ.docx')
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
[xml]$xmlDoc = $content
$ns = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xmlDoc.SelectNodes('//w:p', $ns)
foreach ($p in $paragraphs) {
    $text = ''
    $runs = $p.SelectNodes('.//w:r/w:t', $ns)
    foreach ($r in $runs) {
        $text += $r.InnerText
    }
    if ($text.Trim()) {
        Write-Output $text
    }
}
