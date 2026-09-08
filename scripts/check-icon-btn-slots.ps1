<#
    Finds <VIconBtn> / <VBtn> usages that pass an `icon="..."` prop AND have default-slot
    content (typically a <VTooltip activator="parent">).

    Why it matters: VBtn renders the `icon` prop only when there is no default slot --

        { !slots.default && hasIcon ? <VIcon icon={props.icon}/> : slots.default?.() }

    ...so the button silently renders no icon at all. Fix by putting <VIcon icon="..."/>
    inside the slot (see HistorySummaryView.vue).

    Usage:  pwsh -File scripts/check-icon-btn-slots.ps1
            pwsh -File scripts/check-icon-btn-slots.ps1 -Path src/core
#>
param(
    [string]$Path = 'src'
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$searchRoot = Join-Path $root $Path

$tags = @('VIconBtn', 'VBtn', 'v-icon-btn', 'v-btn')
$findings = @()

foreach ($file in Get-ChildItem -Path $searchRoot -Filter *.vue -Recurse) {
    $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $file.FullName
    if (-not $text) { continue }

    foreach ($tag in $tags) {
        $pattern = "<$tag(?<attrs>\s[^>]*?)?>(?<body>.*?)</$tag>"
        foreach ($m in [regex]::Matches($text, $pattern, 'Singleline')) {
            $attrs = $m.Groups['attrs'].Value
            $body = $m.Groups['body'].Value

            # self-closing tag -- the regex would have run past it to a later closing tag
            if ($attrs -match '/\s*$') { continue }

            # needs a real icon value; bare boolean `icon` is fine (it's just shape)
            if ($attrs -notmatch '(?<![\w:.-])(:?icon)\s*=\s*["''][^"'']+["'']') { continue }

            # named slots are not the default slot
            $default = [regex]::Replace($body, '<template[\s>].*?</template>', '', 'Singleline')
            $default = [regex]::Replace($default, '<!--.*?-->', '', 'Singleline')

            if ($default.Trim().Length -eq 0) { continue }

            # an explicit icon in the slot means it already renders
            if ($default -match '<(VIcon|VIconSmall|v-icon|font-awesome-icon|FontAwesomeIcon)\b') { continue }

            $line = ($text.Substring(0, $m.Index) -split "`n").Count
            $iconName = [regex]::Match($attrs, 'icon\s*=\s*["'']([^"'']+)["'']').Groups[1].Value
            $slotTags = [regex]::Matches($default, '<([A-Za-z][\w-]*)') |
                ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

            $findings += [pscustomobject]@{
                File = [IO.Path]::GetRelativePath($root, $file.FullName)
                Line = $line
                Tag  = $tag
                Icon = $iconName
                Slot = if ($slotTags) { $slotTags -join ', ' } else { 'text' }
            }
        }
    }
}

if ($findings.Count -eq 0) {
    "No icon-prop buttons with default-slot content found under $Path."
    exit 0
}

$findings | Sort-Object File, Line | Format-Table -AutoSize
"{0} occurrence(s). Each renders NO icon -- move the icon into the slot: <VIcon icon=""...""/>" -f $findings.Count
exit 1
