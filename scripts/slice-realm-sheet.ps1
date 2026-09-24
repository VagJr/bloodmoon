param([string]$Sheet = (Join-Path $PSScriptRoot '../client/assets/world/realm-sheet-6x6.png'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$outputFolder = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../client/assets/world/objects'))
New-Item -ItemType Directory -Force -Path $outputFolder | Out-Null
$names = @('dead-tree','mossy-boulder','ruined-arch','gravestones','broken-pillar','moon-mushrooms','river-reeds','evergreen-trees','monster-bones','stone-bridge','ruined-stairs','iron-fence','brazier','lantern','signpost','barrel','supply-crates','stone-well','watchtower','windmill','blacksmith','farm','fortified-gate','barracks','vampire-crest','wolf-crest','twin-moon-crest','war-emblem','peace-emblem','crown-emblem','metal-corner','compass','portrait-frame','life-jewel','vigor-jewel','coin-pile')
$sheetImage = [Drawing.Bitmap]::FromFile([IO.Path]::GetFullPath($Sheet))
try {
  $manifest = @()
  for ($index = 0; $index -lt 36; $index++) {
    $column = $index % 6
    $row = [Math]::Floor($index / 6)
    $left = [int][Math]::Round($column * $sheetImage.Width / 6)
    $top = [int][Math]::Round($row * $sheetImage.Height / 6)
    $right = [int][Math]::Round(($column + 1) * $sheetImage.Width / 6)
    $bottom = [int][Math]::Round(($row + 1) * $sheetImage.Height / 6)
    $bounds = [Drawing.Rectangle]::new($left, $top, $right - $left, $bottom - $top)
    $sprite = $sheetImage.Clone($bounds, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try { $sprite.Save((Join-Path $outputFolder ($names[$index] + '.png')), [Drawing.Imaging.ImageFormat]::Png) } finally { $sprite.Dispose() }
    $manifest += @{ id = $names[$index]; row = $row; column = $column; x = $left; y = $top; width = $bounds.Width; height = $bounds.Height; src = '/assets/world/objects/' + $names[$index] + '.png' }
  }
  @{ sheet = '/assets/world/realm-sheet-6x6.png'; columns = 6; rows = 6; sprites = $manifest } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $outputFolder 'manifest.json') -Encoding UTF8
  Write-Output '36 sprites recortados; transparência preservada.'
} finally { $sheetImage.Dispose() }
