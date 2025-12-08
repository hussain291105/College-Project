export interface PrintBillData {
  billNumber?: string;
  customerName: string;
  billDate?: string;
  paymentMode?: string;
  items: {
    gsm_number: number | string;
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
}

export function printBillInvoice(data: any) {
  const win = window.open("", "_blank");
  if (!win) return;

  const itemsRows = data.items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f2f2f2;">${item.description}</td>
          <td style="padding: 10px 0; text-align:center; border-bottom: 1px solid #f2f2f2;">${item.quantity}</td>
          <td style="padding: 10px 0; text-align:right; border-bottom: 1px solid #f2f2f2;">₹${item.price}</td>
          <td style="padding: 10px 0; text-align:right; border-bottom: 1px solid #f2f2f2;">₹${item.total}</td>
        </tr>
      `
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>Invoice</title>

        <style>
          body {
            font-family: 'Arial', sans-serif;
            background: #ffffff;
            margin: 0;
            padding: 0;
          }

          .invoice-container {
            width: 780px;
            margin: 40px auto;
            padding: 40px 50px;
            background: white;
            box-shadow: 0 0 5px rgba(0,0,0,0.1);
            text-align: center;

            /* Footer fix */
            min-height: 1000px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .header-title {
            font-size: 46px;
            font-weight: bold;
            color: #0F4C3A;
            margin-bottom: 6px;
            text-align: center;
          }

          .invoice-number {
            font-size: 14px;
            color: #1D6B4F;
            margin-top: -4px;
          }

          .flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .right-contact {
            text-align: right;
            font-size: 14px;
            text-align: right;
          }

          .right-contact-title {
            color: #0F4C3A;
            font-weight: bold;
            font-size: 16px; 
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 35px;
          }

          th {
            color: #0F4C3A;
            font-size: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
            text-align: left;
            letter-spacing: 0.5px;
          }

          td {
            font-size: 15px;
            font: normal 15px/24px Arial, sans-serif;
          }

          .summary {
            width: 260px;
            margin-left: auto;
            margin-top: 30px;
          }

          .summary td {
            padding: 5px 0;
          }

          .summary .grand-total {
            font-size: 25px;
            font-weight: bold;
            border-top: 2px solid #aaa;
            padding-top: 8px;
            color: #0F4C3A;
          }

          .date-issued {
            margin-top: 30px;
            font-size: 13px;
          }

          .bottom-line {
            border-top: 4px solid #A8C6A0;
            margin: 40px 0 30px 0;
          }

          .footer {
            font-size: 13px;
            line-height: 20px;
          }

          .footer-logo {
            text-align: right;
          }

          .footer-logo-name {
            color: #0F4C3A;
            font-size: 30px;
            font-weight: bold;
            letter-spacing: 1px;
          }

          .paid-stamp {
            text-align: center;
            margin: 40px 0 20px 0;
          }

          .paid-stamp img {
            width: 180px;
            opacity: 0.85;
          }
        </style>

      </head>

      <body>
        <div class="invoice-container">

          <div>
            <div class="flex">
              <div>
                <div class="header-title">INVOICE</div>
                <div class="invoice-number">INVOICE#: ${data.billNumber}</div>
              </div>
            </div>

              <div class="right-contact">
                <div class="right-contact-title">CUSTOMER CONTACT</div>
                ${data.customerName}<br/>
                ${new Date(data.billDate).toLocaleDateString("en-GB").replace(/\//g, "-")}<br/>
                ${data.paymentMode}
              </div>
            

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align:center;">QTY</th>
                  <th style="text-align:right;">PRICE</th>
                  <th style="text-align:right;">TOTAL</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>
          </div>
            

          <!-- FIXED BOTTOM FOOTER -->
          <div style="margin-top:auto;">
            <hr style="border: 1px solid #A8C6A0; margin: 20px 0;">
            <table class="summary">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align:right;">₹${data.subtotal}</td>
              </tr>
              <tr>
                <td>Tax (18%):</td>
                <td style="text-align:right;">₹${(data.subtotal * 0.18).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="grand-total">Total:</td>
                <td class="grand-total" style="text-align:right;">₹${(data.subtotal * 1.18).toFixed(2)}</td>
              </tr>
            </table>

            <div class="bottom-line"></div>

            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div class="footer">
                Fresh Soft Tissue Enterprises <br>
                6-27-700 Park Ave <br>
                Pune, Maharashtra <br>
                411006 <br>
                fsenterprises523@gmail.com <br>
                www.fsenterprise.com
              </div>

              <div style="position: relative; width: 220px; margin-left: auto;">
                <div class="paid-stamp">
                  <img 
                    src="/paid-stamp copy.png" 
                    alt="Paid Stamp"
                    style="width: 220px; position: relative; z-index: 1;"
                  />

                  <img
                    src="/mustafa-sign.png" 
                    alt="Signature"
                    style="
                      position: absolute;
                      bottom: -10px;
                      right: -60px;
                      width: 180px;
                      z-index: 2;
                      transform: rotate(-8deg);
                    "
                  />
                <div class="footer-logo-name">Fs Enterprise</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <script>
          window.print();
          setTimeout(() => window.close(), 400);
        </script>

      </body>
    </html>
  `);

  win.document.close();
}
