// Test stub for the Workers-runtime built-in `cloudflare:email` module.
// Only the shape send()/EmailMessage needs is provided.
export class EmailMessage {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly raw: string
  ) {}
}
