/**
 * A lightweight, dependency-free code formatter.
 * Standardizes indentation for C-style languages (JS, TS, C++, Java, Rust, Go).
 * Supports simple brace tracking for indentation and removes multiple blank lines.
 */
export function formatCode(code: string, language: string): string {
  // Python relies on semantic indentation, so we only trim and remove extra blank lines.
  if (language === 'python') {
    return code
      .split('\n')
      .map(line => line.trimEnd())
      .filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === ''))
      .join('\n');
  }

  let indentLevel = 0;
  const tab = '  '; // 2 spaces
  let result = '';
  
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line === '') {
      // Prevent double empty lines
      if (i > 0 && lines[i - 1].trim() !== '') {
        result += '\n';
      }
      continue;
    }

    // Check if the line begins with a closing bracket/brace
    if (line.match(/^[}\]]/)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    result += tab.repeat(indentLevel) + line + '\n';

    // Simplified brace counting for the next line
    // (Ignores strings/comments to keep it lightweight and fast for this demo scale)
    const openBraces = (line.match(/[{[]/g) || []).length;
    const closeBraces = (line.match(/[}\]]/g) || []).length;
    
    if (openBraces > closeBraces) {
      indentLevel += (openBraces - closeBraces);
    } else if (closeBraces > openBraces && !line.match(/^[}\]]/)) {
      // If it closes on this line but didn't start with a closing brace
      indentLevel = Math.max(0, indentLevel - (closeBraces - openBraces));
    }
  }

  return result.trim();
}
