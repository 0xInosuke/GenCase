param(
    [string]$BaseUrl = "http://127.0.0.1:3000",
    [string]$ApiKey = "key1243456756756"
)

$list = Invoke-RestMethod `
    -Method Get `
    -Uri "$BaseUrl/external-api/cases?search=%7B%22source%22%3A%22api_test1%22%7D&sort_by=id&sort_dir=desc&page=1&page_size=20" `
    -Headers @{ "x-api-key" = $ApiKey }

if (-not $list.items -or $list.items.Count -eq 0) {
    throw "No matching cases found for update."
}

$target = $list.items[0]

$updateBody = @{
    case_title = "$($target.case_title) Updated"
    stage_code = $target.stage_code
    case_data = @{
        source = "api_test1"
        owner = "system1"
        severity = "high"
    }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod `
    -Method Put `
    -Uri "$BaseUrl/external-api/cases/$($target.id)" `
    -Headers @{ "x-api-key" = $ApiKey } `
    -ContentType "application/json" `
    -Body $updateBody | ConvertTo-Json -Depth 8
