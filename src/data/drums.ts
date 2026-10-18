// Рисунок на барабане — варианты на выбор владельца (?drum=… в адресе).
// yurt — нарисованный купол юрты; medallion — медальон владельца в своих цветах;
// medallion-drum — тот же медальон в цветах самого первого барабана (бумага, золото, чернила);
// medallion-duo — два цвета: бумага и тёмно-синий; medallion-pale — без жёлтого, лучи бледные, как узор
export type DrumLook = 'yurt' | 'medallion' | 'medallion-drum' | 'medallion-duo' | 'medallion-pale'

const LOOKS: DrumLook[] = ['yurt', 'medallion', 'medallion-drum', 'medallion-duo', 'medallion-pale']
const param = new URLSearchParams(window.location.search).get('drum') as DrumLook | null

export const DRUM_LOOK: DrumLook = param && LOOKS.includes(param) ? param : 'yurt'
