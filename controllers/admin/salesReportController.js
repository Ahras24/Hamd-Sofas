const Order = require('../../models/ordersModel');
const User = require('../../models/usersModel');
const {getFilterSalesReport} = require('../../utils/filterSalesReport');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const getSalesReport = async (req,res)=>{
    try {

        const orders = await Order.find({ status:'delivered' }).populate('userId').sort({createdAt:-1})

        const totalSales = orders.reduce(( sum,order) => sum + order.grandTotal, 0);
        const totalOrders = orders.length;
        const totalDiscount = orders.reduce((sum,order) => sum + (order.discount || 0), 0);
        const couponUsedCount = orders.filter(order => order.couponApplied).length;

        res.render('admin/sales-report', {
            orders,
            totalSales,
            totalOrders,
            totalDiscount,
            couponUsedCount,
            reportType: '',
            startDate: '',
            endDate: ''
        });
        
    } catch (error) {
        console.error(`Error while loading sales report page, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const filterSalesReport = async (req,res) => {
    try {
        
        const { reportType,startDate, endDate } = req.body;

        const orders = await getFilterSalesReport(reportType,startDate,endDate);

        const totalSales = orders.reduce((sum,order) => sum + order.grandTotal, 0);
        const totalOrders = orders.length;
        const totalDiscount = orders.reduce((sum,order) => sum + (order.discount || 0), 0);
        const couponUsedCount = orders.filter(order => order.couponApplied).length;

        res.render('admin/sales-report', {
            orders,
            totalSales,
            totalOrders,
            totalDiscount,
            couponUsedCount,
            reportType,
            startDate,
            endDate
        });

    } catch (error) {
        console.error(`error while filtering sales report, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const downloadSalesReportPDF = async (req,res)=>{
    try {

        const { reportType, startDate, endDate } = req.query;
        const orders = await getFilterSalesReport(reportType, startDate, endDate);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

        doc.pipe(res);
        doc.fontSize(18).text('Sales Report', { align: 'center' }).moveDown();

        doc.fontSize(14).text(`Summary`, { underline: true }).moveDown();
        doc.fontSize(12)
       .text(`Total Orders: ${orders.length}`)
       .text(`Total Sales: ₹${orders.reduce((sum, o) => sum + o.grandTotal, 0)}`)
       .text(`Total Discounts: ₹${orders.reduce((sum, o) => sum + (o.discount || 0), 0)}`)
       .text(`Coupons Used: ${orders.filter(o => o.couponApplied).length}`)
       .moveDown();

      doc.fontSize(13).text('Order Details:', { underline: true }).moveDown(0.5);

const tableTop = doc.y + 10;
const startX = 50;
const rowHeight = 38;

const colWidths = [70, 110, 90, 60, 60, 80, 50];
const headers = ['Date', 'Order ID', 'Customer', 'Amount', 'Discount', 'Coupon Code', 'Payment Method'];

// Draw Header Row Background
let headerX = startX;
headers.forEach((text, i) => {
  // Draw individual cell background
  doc
    .rect(headerX, tableTop, colWidths[i], rowHeight)
    .fillAndStroke('#9CAEA9', '#2B2B2B');

  // Add text
  doc
    .fillColor('#2B2B2B')
    .fontSize(10)
    .text(text, headerX + 5, tableTop + 8, {
      width: colWidths[i] - 10,
      align: 'left'
    });

  headerX += colWidths[i];
});

// Reset fill for rows
doc.fillColor('black');

let y = tableTop + rowHeight;

orders.forEach((order, idx) => {
  // Check page break
  if (y + rowHeight > doc.page.height - 50) {
    doc.addPage();
    y = 50;

    // Redraw table headers on new page
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight)
       .fillAndStroke('#9CAEA9', '#2B2B2B');

    headers.forEach((text, i) => {
      doc
        .fillColor('#2B2B2B')
        .fontSize(10)
        .text(text, startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5, y + 5, { width: colWidths[i] - 10 });
    }); 

    y += rowHeight;
    doc.fillColor('black');
  }

 // Draw row cells and borders properly
const values = [
  order.createdAt.toISOString().slice(0, 10),
  order.customId,
  order.userId?.username || 'Guest',
  `₹${order.grandTotal}`,
  `₹${order.discount || 0}`,
  order.couponApplied ? order.couponCode : 'N/A',
  order.paymentMethod.toUpperCase()
];
   
let cellX = startX;
values.forEach((text, i) => {
  // Draw cell border
  doc.rect(cellX, y, colWidths[i], rowHeight).stroke();

  // Draw text with padding
  doc
    .fontSize(10)
    .text(text, cellX + 5, y + 6, {
      width: colWidths[i] - 10,
      height: rowHeight - 10,
      lineBreak: i===1,
      align: 'left'
    });

  cellX += colWidths[i];
});

  y += rowHeight;
});

    doc.end();

    } catch (error) {
        console.error(`Error while downloading the PDF sales report document, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const downloadSalesReportExcel = async (req,res)=>{
    try {

        const { reportType, startDate, endDate } = req.query;
        const orders = await getFilterSalesReport(reportType, startDate, endDate);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.addRow([]);
        worksheet.addRow(['--- SUMMARY ---']);
        worksheet.addRow(['Total Orders', orders.length]);
        worksheet.addRow(['Total Sales', `₹${orders.reduce((sum, o) => sum + o.grandTotal, 0)}`]);
        worksheet.addRow(['Total Discounts', `₹${orders.reduce((sum, o) => sum + (o.discount || 0), 0)}`]);
        worksheet.addRow(['Coupons Used', orders.filter(o => o.couponApplied).length]);
        worksheet.addRow([]);
  
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Order ID', key: 'orderId', width: 25 },
          { header: 'Customer', key: 'customer', width: 20 },
          { header: 'Amount (₹)', key: 'amount', width: 15 },
          { header: 'Discount (₹)', key: 'discount', width: 15 },
          { header: 'Coupon Code', key: 'coupon', width: 20 },
          { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        ];

    orders.forEach(order => {
      worksheet.addRow({
        date: order.createdAt.toISOString().slice(0, 10),
        orderId: order.customId,
        customer: order.userId?.username || 'Guest',
        amount: order.grandTotal,
        discount: order.discount || 0,
        coupon: order.couponApplied ? order.couponCode : 'N/A',
        paymentMethod: order.paymentMethod,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
        
    } catch (error) {
        console.error(`Error while downloading the Excel sales report document, ${error}`);
        return res.status(500).json("Internal server error");
    }
}


module.exports = {
    getSalesReport,
    filterSalesReport,
    downloadSalesReportPDF,
    downloadSalesReportExcel
};