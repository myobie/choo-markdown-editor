import { newBlock, newEmptyBlock, newPart } from './model'

export const document = [
  newBlock([
    newPart('Hello world '),
    newPart('**', { type: 'control', controlType: 'bold', styles: ['bold'] }),
    newPart('hooray for ', { styles: ['bold', 'italic'] }),
    newPart('_', { type: 'control', controlType: 'italic', styles: ['bold', 'italic'] }),
    newPart('nested italic', { styles: ['bold', 'italic'] }),
    newPart('_', { type: 'control', controlType: 'italic', styles: ['bold', 'italic'] }),
    newPart(' text', { styles: ['bold'] }),
    newPart('**', { type: 'control', controlType: 'bold', styles: ['bold'] }),
    newPart(' foo * bar')
  ]),
  newEmptyBlock(),
  newBlock([
    newPart('    Nathan Herald')
  ], { styles: ['code'] }),
  newEmptyBlock(),
  newBlock([
    newPart('_', { type: 'control', controlType: 'italic', styles: ['italic'] }),
    newPart('[', { type: 'control', controlType: 'linkFull', styles: ['link', 'italic'] }),
    newPart('Email me', { styles: ['link', 'italic'] }),
    newPart('](', { type: 'control', controlType: 'linkFull', styles: ['link', 'italic'] }),
    newPart('mailto:me@nathanherald.com', { styles: ['link', 'italic'] }),
    newPart(')', { type: 'control', controlType: 'linkFull', styles: ['link', 'italic'] }),
    newPart('_', { type: 'control', controlType: 'italic', styles: ['italic'] })
  ]),
  newEmptyBlock(),
  newBlock([
    newPart("> What's love got to do with it")
  ], { styles: ['quote'] })
]
