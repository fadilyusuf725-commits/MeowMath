$ErrorActionPreference = 'Stop'
$DocumentPaths = $args

if ($DocumentPaths.Count -eq 0) {
  throw 'Berikan setidaknya satu dokumen DOCX untuk diperiksa.'
}

$word = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  foreach ($documentPath in $DocumentPaths) {
    $document = $null
    try {
      $document = $word.Documents.Open($documentPath, $false, $true, $false)
      $pageCount = $document.ComputeStatistics(2)
      Write-Output "WORD_OPEN_OK=$($document.Name);PAGES=$pageCount"
    } finally {
      if ($document) { $document.Close(0) }
    }
  }
} finally {
  if ($word) { $word.Quit() }
}
