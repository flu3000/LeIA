export interface Fonte {
  id_externo: string
  tipo: string
  titulo: string
  autor_canal: string
  dificuldade: string
  link: string
  por_que_estudar: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Fonte[]
  citations?: string[]
  createdAt?: string
}
