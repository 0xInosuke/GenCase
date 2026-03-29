param(
    [string]$BaseUrl = "http://127.0.0.1:3000",
    [string]$ApiKey = "key1243456756756"
)

$body = @{
    workflow_id = 1
    case_title = "External Script Created Case"
    stage_code = "draft"
    case_data = @{
        source = "api_test1"
        owner = "system1"
        severity = "medium"
    }
} | ConvertTo-Json -Depth 6

Invoke-RestMethod `
    -Method Post `
    -Uri "$BaseUrl/external-api/cases" `
    -Headers @{ "x-api-key" = $ApiKey } `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json -Depth 8
