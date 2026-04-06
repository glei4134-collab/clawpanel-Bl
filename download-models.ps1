$ErrorActionPreference = "Continue"

Write-Host "开始下载模型..."

$ghArgs = @("api", "repos/mrdoob/three.js/contents/examples/models/gltf/Soldier.glb", "--jq", ".content")
$content = gh @ghArgs

if ($LASTEXITCODE -eq 0 -and $content) {
    $bytes = [System.Convert]::FromBase64String($content)
    [System.IO.File]::WriteAllBytes("public/models/soldier-color.glb", $bytes)

    $file = Get-Item "public/models/soldier-color.glb"
    Write-Host "✅ Soldier.glb 下载完成: $([math]::Round($file.Length / 1MB, 2)) MB"
} else {
    Write-Host "❌ Soldier.glb 下载失败"
}

Write-Host ""
Write-Host "📁 public/models/ 目录:"
Get-ChildItem "public/models/" -File | Where-Object { $_.Extension -eq ".glb" } | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)"
}
