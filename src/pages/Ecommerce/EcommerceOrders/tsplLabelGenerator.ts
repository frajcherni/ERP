// src/utils/tsplLabelGenerator.ts
export class TSPLLabelGenerator {
  private commands: string[] = [];

  // Large Label: 70mm × 60mm (matching your 7×6 cm)
  initializeLargeLabel(): void {
    this.commands = [
      'SIZE 70 mm, 60 mm',
      'GAP 2 mm, 0 mm',
      'SPEED 4',
      'DENSITY 8',
      'DIRECTION 1',
      'REFERENCE 0,0',
      'OFFSET 0 mm',
      'SET PEEL OFF',
      'SET CUTTER OFF'
    ];
  }

  // Small Ticket: 44mm × 22mm (matching your 4.4×2.2 cm)
  initializeSmallTicket(): void {
    this.commands = [
      'SIZE 44 mm, 22 mm',
      'GAP 2 mm, 0 mm',
      'SPEED 4',
      'DENSITY 8',
      'DIRECTION 1',
      'REFERENCE 0,0',
      'OFFSET 0 mm',
      'SET PEEL OFF',
      'SET CUTTER OFF'
    ];
  }

  addText(x: number, y: number, font: string, fontSize: number, content: string, bold: boolean = false): void {
    // TSPL: TEXT x,y,"font",rotation,x-multiplication,y-multiplication,"content"
    const rotation = 0;
    const xMult = bold ? fontSize + 1 : fontSize;
    const yMult = bold ? fontSize + 1 : fontSize;
    this.commands.push(`TEXT ${x},${y},"${font}",${rotation},${xMult},${yMult},"${content}"`);
  }

  addBarcode(x: number, y: number, barcodeValue: string, height: number = 60): void {
    // TSPL: BARCODE x,y,"128",height,humanReadable,rotation,narrow,wide,"content"
    this.commands.push(`BARCODE ${x},${y},"128",${height},0,0,2,5,"${barcodeValue}"`);
  }

  generateLargeLabel(
    reference: string,
    categoryName: string,
    fournisseurCode: string,
    barcodeValue: string,
    encryptedPrice: string,
    showPrice: boolean,
    formattedPrice: string
  ): string {
    this.initializeLargeLabel();

    // Add border
    this.commands.push('BOX 20,20,680,580,2');

    // Reference - centered at top
    this.addText(250, 50, '4', 2, reference.toUpperCase(), true);

    // Category - if exists
    if (categoryName) {
      this.addText(250, 120, '3', 2, categoryName.toUpperCase());
    }

    // Barcode - centered
    this.addBarcode(150, 180, barcodeValue, 80);

    // Fournisseur code and encrypted price on same line
    this.addText(150, 320, '3', 2, `${fournisseurCode}:`);
    this.addText(350, 320, '3', 2, encryptedPrice);

    // Price - if showPrice is true
    if (showPrice) {
      this.addText(200, 400, '4', 2, 'PRIX:');
      this.addText(350, 400, '4', 3, formattedPrice, true);
    }

    this.commands.push('PRINT 1,1');
    return this.commands.join('\r\n');
  }

  generateSmallTicket(
    reference: string,
    categoryName: string,
    fournisseurCode: string,
    barcodeValue: string,
    encryptedPrice: string,
    showPrice: boolean,
    formattedPrice: string
  ): string {
    this.initializeSmallTicket();

    // Barcode - positioned at top
    this.addBarcode(50, 40, barcodeValue, 45);

    // Reference - below barcode
    this.addText(50, 100, '2', 2, reference.toUpperCase(), true);

    // Category - if exists
    if (categoryName) {
      this.addText(50, 130, '1', 2, categoryName.toUpperCase());
    }

    // Fournisseur code and encrypted price
    this.addText(50, 160, '2', 2, `${fournisseurCode}:`);
    this.addText(180, 160, '2', 2, encryptedPrice);

    // Price - if showPrice is true
    if (showPrice) {
      this.addText(50, 190, '2', 2, 'PRIX:');
      this.addText(140, 190, '2', 3, formattedPrice, true);
    }

    this.commands.push('PRINT 1,1');
    return this.commands.join('\r\n');
  }
}

export default TSPLLabelGenerator;