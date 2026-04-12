// src/utils/qzTrayService.ts
const qz = require('qz-tray');

class QZTrayService {
  private static instance: QZTrayService;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): QZTrayService {
    if (!QZTrayService.instance) {
      QZTrayService.instance = new QZTrayService();
    }
    return QZTrayService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    if (!this.connectionPromise) {
      this.connectionPromise = new Promise(async (resolve, reject) => {
        try {
          console.log("Attempting to connect to QZ Tray...");
          
          // IMPORTANT: Set promise type BEFORE any other operations
          // Use 'promise' instead of 'Promise' for older versions
          await qz.api.setPromiseType('promise');
          
          // Set security algorithm
          await qz.api.setSha256Type('SHA-256');
          
          // Connect to QZ Tray
          await qz.websocket.connect({
            host: 'localhost',
            port: 8181,
            usingSecure: true,
            keepAlive: 60
          });
          
          this.isConnected = true;
          console.log('✅ QZ Tray connected successfully');
          resolve();
          
        } catch (error: any) {
          this.connectionPromise = null;
          console.error('❌ QZ Tray connection failed:', error);
          
          // Try fallback connection
          try {
            console.log("Trying fallback connection (insecure)...");
            await qz.websocket.connect({
              host: 'localhost',
              port: 8182,
              usingSecure: false
            });
            
            this.isConnected = true;
            console.log('✅ QZ Tray connected (insecure mode)');
            resolve();
          } catch (fallbackError) {
            console.error('❌ Fallback connection also failed:', fallbackError);
            reject(error);
          }
        }
      });
    }
    
    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await qz.websocket.disconnect();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('QZ Tray disconnected');
    } catch (error) {
      console.error('Error disconnecting QZ Tray:', error);
    }
  }

  async getPrinters(): Promise<string[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const printers = await qz.printers.find();
      return printers.map((printer: any) => printer.name);
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  }

  async getDefaultPrinter(): Promise<string | null> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const printer = await qz.printers.getDefault();
      return printer?.name || null;
    } catch (error) {
      console.error('Error getting default printer:', error);
      return null;
    }
  }

  async printRawTSPL(printerName: string, tsplCommands: string): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    // Convert TSPL string to bytes
    const enc = new TextEncoder();
    const commandBytes = enc.encode(tsplCommands);

    // Create print data with proper format for TSPL
    const printData = [
      {
        type: 'raw',
        data: Array.from(commandBytes), // Convert to array for compatibility
        options: {
          language: 'TSPL',
          dotDensity: '8dpmm'
        }
      }
    ];

    // Send to printer
    await qz.print(printerName, printData);
  }
}

export default QZTrayService.getInstance();