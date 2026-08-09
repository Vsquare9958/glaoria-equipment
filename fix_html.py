from pathlib import Path

root = Path('d:/Glaoria')

# Landing page
landing = root / 'glaoria-landing.html'
text = landing.read_text(encoding='utf-8')
link_line = '<link rel="stylesheet" href="css/landing.css">'
idx = text.find(link_line)
if idx == -1:
    raise SystemExit('landing.css link not found')
end_head = text.find('</head>', idx)
if end_head == -1:
    raise SystemExit('</head> not found in landing.html')
# Keep everything through link line, then drop leftover inline CSS before </head>
prefix = text[: idx + len(link_line)]
suffix = text[end_head:]
text = prefix + '\n' + suffix
# Remove remaining stray style content if any before <body>
body_start = text.find('<body>')
if body_start == -1:
    raise SystemExit('<body> not found in landing.html')
text = text[:end_head] + suffix if False else prefix + suffix
landing.write_text(text, encoding='utf-8')

# Enquiry page
enquiry = root / 'glaoria-enquiry.html'
text = enquiry.read_text(encoding='utf-8')
style_start = text.find('<style>')
style_end = text.find('</style>', style_start)
if style_start == -1 or style_end == -1:
    raise SystemExit('style block not found in enquiry.html')
new_links = '<link rel="stylesheet" href="css/base.css">\n<link rel="stylesheet" href="css/enquiry.css">'
text = text[:style_start] + new_links + text[style_end + len('</style>'):]
script_start = text.find('<script>')
script_end = text.find('</script>', script_start)
if script_start == -1 or script_end == -1:
    raise SystemExit('script block not found in enquiry.html')
text = text[:script_start] + '<script src="js/enquiry.js" defer></script>\n' + text[script_end + len('</script>'):]
enquiry.write_text(text, encoding='utf-8')

print('Repair complete')
