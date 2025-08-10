export class Logger {
  constructor(private component: string) {}
  
  info(message: string, meta?: any): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component: this.component,
      message,
      ...meta
    }));
  }
  
  warn(message: string, meta?: any): void {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      component: this.component,
      message,
      ...meta
    }));
  }
  
  error(message: string, meta?: any): void {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: this.component,
      message,
      ...meta
    }));
  }
}