import { Observable } from 'rxjs/Observable'
import { linter } from 'eslint'
import { ISnapshot, ISnapshotMessage } from './common'

/// Header which might be appended on lint errors.
export const LINT_ERROR_HEADER = '[!] There are syntax error/warning(s)'

/// Rule indicator for missing semicolon
export const MISSING_SEMICOLON_ID = 'semi'
export const MISSING_SEMICOLON_MESSAGE = 'Error: Missing Semicolon'

const Messages = {
  [MISSING_SEMICOLON_ID]: MISSING_SEMICOLON_MESSAGE
}

/**
 * Lint the source code
 */
export function lint(code: string): ISnapshotMessage {
  const results = linter.verify(code, {
    rules: {
      semi: 'error'
    }
  }).map(r => {
    const message = Messages[r.ruleId]
    return {
      line: r.line,
      endLine: r.endLine,
      column: r.column,
      endColumn: r.endColumn,
      message: message || ''
    }
  })
  return {
    header: LINT_ERROR_HEADER,
    results,
    code
  }
}

export function createLinter(snapshot$: Observable<[ISnapshot, ISnapshotMessage]>):
  Observable<[ISnapshot, ISnapshotMessage]> {
  return Observable.create((observer) => {
    snapshot$.subscribe(([snapshot, _]) => {
      const result = lint(snapshot.code)
      observer.next([snapshot, result])
    })
  })
}

