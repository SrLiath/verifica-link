export interface Link {
  status: "UP" | "DOWN"
  speed?: number
}

export interface Client {
  id: string
  name: string
  links: Link[]
  speed: number
}
