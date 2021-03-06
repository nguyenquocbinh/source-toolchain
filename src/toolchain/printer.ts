import { generate } from 'escodegen'
import { ISnapshotError, Any, isUndefined, unbox } from './common'

/**
 * Pretty print snapshot output message
 */
export function printErrorToString(error: ISnapshotError): string {
  let lines: string[]
  if (error.sourceFile) {
    let found = false
    let curr = error.snapshot
    while (!found) {
      if (curr.id === error.sourceFile) {
        lines = curr.lines
        found = true
      } else if (curr.parent) {
        curr = curr.parent
      } else {
        break
      }
    }
  } else {
    lines = error.snapshot ? error.snapshot.lines : []
  }
  let header = `${error.message}\n`
  if (error.line && error.column)  {
    header += `On (${error.line},${error.column})`
    if (error.endLine) {
      header += `-(${error.endLine},${error.endColumn})`
    }
  }
  let affectedCode = ''
  if (lines.length > 0) {
    const endLine = error.endLine || error.line
    for (var li = Math.max(error.line - 1, 1);
         li <= Math.min(endLine + 1, lines.length);
         ++li
      ) {
      const codeInLine = lines[li - 1]
      affectedCode += codeInLine + '\n'
      try {
        if (li === error.line) {
          const leftPadding = Array(error.column).join(' ')
          const rightPaddingLength = (error.endLine === error.line && error.endColumn)
          ? error.endColumn - error.column + 1
          : codeInLine.length - error.column + 1
          const rightPadding = Array(rightPaddingLength).join('-')
          affectedCode += leftPadding + '^' + rightPadding + '\n'
        } else if (li === endLine) {
          const leftPadding = Array(error.endColumn).join('-')
          affectedCode += leftPadding + '^\n'
        }
      } catch (e) {
        affectedCode = codeInLine
      }
    }
    affectedCode += '\n'
  }
  return `${header}\n${affectedCode}`
}

export function listToString(item, context = {}, lengthSoFar = 0) {
  if (lengthSoFar > 100) {
    return '(... list too long, result is truncated)'
  }
  if ((item instanceof Array) && item.length === 0) {
    return '[]';
  } else if (item instanceof Array && item.length === 2) {
    return '[' + listToString(item[0], context)
      + ', ' + listToString(item[1], context, lengthSoFar + 1) + ']'
  } else if (item instanceof Array) {
    let shouldTruncate = item.length > 100
    let truncate = item
    let truncateMessage = shouldTruncate
      ? ' ...(array too long, result is truncated)'
      : ''
    if (shouldTruncate) {
      truncate = item.slice(0, 100)
    }
    return '[' + truncate.map(function(x) {
        return printValueToString(x, context)
    }).join(',') + truncateMessage + ']'
  } else if (typeof item !== 'undefined') {
    return item.toString()
  } else if (typeof item === 'undefined') {
    return 'undefined'
  } else {
    return item.toString()
  }
}

export function printValueToString(val: Any, context = {}): string {
  if (val.type === 'function') {
    return generate(val.value)
  } else {
    const value = unbox(val, context)
    if (value instanceof Array) {
      return listToString(value, context)
    } else if (typeof value === 'function') {
      const str = value.toString()
      const lines: string[] = str.replace(/(function .*\(.*\)).*$/m, '$1 {\n    [body omitted]\n}\n').split('\n')
      return lines.slice(0, 3).join('\n')
    } else if (isUndefined(val)) {
      return 'undefined'
    } else if (value && typeof value.toString === 'function') {
      return value.toString()
    } else if (typeof value === 'undefined') {
      return 'undefined'
    } else if (typeof value === 'object') {
      const cache = []
      return JSON.stringify(value.value, function(key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            return;
          }
          cache.push(value);
        }
      })
    } else {
      return value + ''
    }
  }
}
