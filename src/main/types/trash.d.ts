declare module 'trash' {
  function trash(input: string | readonly string[], options?: trash.Options): Promise<void>

  namespace trash {
    interface Options {
      glob?: boolean
    }
  }

  export = trash
}
