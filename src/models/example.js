import BaseModel from './base-model'

export default class Example extends BaseModel {
    constructor() {
        super()

        BaseModel.addCustomProperty(this, {
            name: 'birthday',
            value: null,
            getter() {
                return this._birthday
            },
            setter(value) {
                this._birthday = new Date(value)
            }
        })
    }

    name = ''
    age = 0
    colourOfSkin = null
}
