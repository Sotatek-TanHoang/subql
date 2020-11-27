import {main} from '../test'
import {isNonNullType} from 'graphql'
import {transformTypes} from './types-mapping'
import ejs = require('ejs');
import fs = require('fs');
const path = require('path')
const template_path = path.resolve(__dirname, '../template/model.ts.ejs')
const typesPath = process.cwd() + '/src/types'

// 4. Save the rendered schema
function makeSchema(className: string, data: string) {
  const filename = className + '.ts'
  const file = typesPath + '/' + filename

  fs.writeFile(file, data, function () {
    console.log(`>--- Schema ${className} generated !`)
  })
  // console.log('model path', file)
}

// 3. Render entity data in ejs template
export function renderTemplate(className: string, model_data: object) {
  ejs.renderFile(template_path, model_data, function (err, str) {
    if (err) {
      console.log(`!!! When render entity ${className} to schema have following problems !!! `)
      console.log(err)
    } else {
      // console.log(str)
      makeSchema(className, str)
    }
  })
}

// 2. Re-format the field of the entity
export function processFields({fields}: { fields: any }) {
  const field_list = []
  // eslint-disable-next-line guard-for-in
  for (const k in fields) {
    const type = isNonNullType(fields[k].type) ? fields[k].type.ofType : fields[k].type
    const new_type =  transformTypes(type.toString())
    field_list.push({
      name: fields[k].name,
      type: new_type,
      required: isNonNullType(fields[k].type),
    })
  }
  return field_list
}

// 1. Loop all entities and render it
export async function generateSchema() {
  const extractEntities = await main()

  extractEntities.forEach(function (entity) {
    const baseFolderPath = '.../../base'
    const className = entity.name
    const fields = entity.getFields()
    const processedFields = processFields({fields: fields})
    const model_template = {
      props: {
        baseFolderPath: baseFolderPath,
        className: className,
        fields: processedFields,
      },
    }
    console.log(`<--- Start generate schema ${model_template.props.className}`)
    renderTemplate(className, model_template)
  })
}

