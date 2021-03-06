import test from 'ava'
import * as printer from '../../src/toolchain/printer'
import { Snapshot } from '../../src/toolchain/common'

const snapshot1 = new Snapshot({
  code: '\n'
    + 'function foo() {\n'
    + '   return 2;\n'
    + '}\n'
    + 'function bar() {\n'
    + '   return 9;\n'
    + '}\n'
})

const message1 = {
  snapshot: snapshot1,
  from: 'test',
  line: 2, 
  endLine: 4,
  column: 4,
  endColumn: 8,
  message: 'Test Message'
}

test('printToString', (t) => { 
  const result = printer.printErrorToString(message1) 
  t.true(typeof result === 'string')
  t.regex(result, /Test Message/) 
  t.regex(result, /\(2,4\)-\(4,8\)/)  
  t.regex(result, /function foo()/) 
  t.regex(result, /-------\^/)
})
