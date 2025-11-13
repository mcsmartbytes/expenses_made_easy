# Reports & Categories Setup Guide

## 🎉 What's Been Completed

### ✅ Custom Categories Management
- **Full CRUD operations**: Create, Read, Update, Delete categories
- **Default categories protected**: Built-in categories cannot be edited/deleted
- **User-specific categories**: Each user can create their own custom categories
- **Real-time updates**: Categories sync immediately across the app

### ✅ Comprehensive Report Generation
- **PDF Export**: Professional PDF reports with customizable templates
- **Excel/CSV Export**: Spreadsheet-compatible format for further analysis
- **Date Range Selection**: Generate reports for any time period
- **Multiple Templates**:
  - Simple: Basic expense listing
  - Detailed: Full breakdown with categories
  - IRS Compliant: Tax-ready reports with compliance notes
- **Includes Both Expenses & Mileage**: Comprehensive financial overview
- **Real-time Preview**: See totals before generating reports
- **Company Name**: Optional company branding on reports

### ✅ IRS Compliance Features
- **Standard Mileage Rate**: Automatically calculates at $0.67/mile
- **Business vs Personal**: Proper classification for tax purposes
- **Compliance Tooltips**: Built-in IRS guidance
- **Detailed Documentation**: All required information for tax filing

## 🚀 How to Use

### Managing Categories

1. From the Dashboard, click **"🏷️ Manage Categories"**
2. View all your expense categories (default + custom)
3. **Add New Category**:
   - Click "+ Add Custom Category"
   - Enter the category name
   - Click "Create"
4. **Edit Category**:
   - Click "Edit" on any custom category
   - Update the name
   - Click "Update"
5. **Delete Category**:
   - Click "Delete" on any custom category
   - Confirm deletion

**Note**: Default categories (Food & Dining, Transportation, etc.) cannot be edited or deleted.

### Generating Reports

1. From the Dashboard, click **"📊 Generate Reports"**
2. **Configure Your Report**:
   - Enter Company Name (optional)
   - Set Start Date (YYYY-MM-DD format)
   - Set End Date (YYYY-MM-DD format)
   - Choose Template: Simple, Detailed, or IRS Compliant
3. **Preview Report**:
   - Click "Preview Report"
   - Review expenses, mileage, and totals
4. **Export Report**:
   - Click "📄 Export as PDF" for a printable PDF
   - Click "📊 Export as CSV/Excel" for spreadsheet format
5. **Share**:
   - Reports can be shared via email, cloud storage, etc.
   - PDF is best for printing or official documentation
   - CSV is best for accounting software or further analysis

### Report Contents

**Each report includes**:
- **Expenses Section**:
  - Date, Category, Description, Amount
  - Subtotal for all expenses
- **Mileage Section** (business trips only):
  - Date, Route (From → To), Miles, Reimbursement
  - Total miles and total reimbursement
- **Grand Total**: Combined expenses + mileage reimbursement
- **Metadata**: Company name, date range, generation date

### IRS-Compliant Reports

When you select the "IRS Compliant" template:
- Includes IRS compliance note
- Shows standard mileage rate ($0.67/mile)
- Proper formatting for tax documentation
- Separates business from personal expenses
- Includes all required information for deductions

## 📱 Dashboard Features

Your dashboard now has quick access to:
- **📝 View All Expenses** - Manage your expense tracking
- **🚗 View Mileage Tracking** - Track and review trips
- **📊 Generate Reports** - Create PDF/CSV reports
- **🏷️ Manage Categories** - Customize expense categories
- **+ Add Expense** - Quick expense entry
- **Logout** - Sign out of your account

## 💡 Tips & Best Practices

### For Categories:
1. Create categories that match your tax filing needs
2. Keep category names short and descriptive
3. Use specific categories for better expense tracking
4. Common categories: Client Entertainment, Office Supplies, Travel, Meals, etc.

### For Reports:
1. **Monthly Reports**: Generate at end of each month for bookkeeping
2. **Quarterly Reports**: For quarterly tax estimates
3. **Annual Reports**: For year-end tax filing
4. **Project-Based**: Use date ranges to track specific projects
5. **Keep Copies**: Save PDFs for your records

### Date Formats:
- Always use YYYY-MM-DD format (e.g., 2024-01-15)
- Start date must be before end date
- Tip: For a full month, use first and last day (2024-01-01 to 2024-01-31)
- Tip: For a year, use (2024-01-01 to 2024-12-31)

## 🎯 Example Use Cases

### Use Case 1: Monthly Business Review
```
Company Name: My Business LLC
Start Date: 2024-01-01
End Date: 2024-01-31
Template: Detailed
Export: PDF + CSV
```
- PDF for your accountant
- CSV to import into QuickBooks

### Use Case 2: Tax Season Preparation
```
Company Name: Your Business Name
Start Date: 2024-01-01
End Date: 2024-12-31
Template: IRS Compliant
Export: PDF
```
- Complete tax-ready documentation
- Includes all mileage and expenses
- IRS-compliant formatting

### Use Case 3: Client Project Billing
```
Company Name: Client Name
Start Date: 2024-03-01
End Date: 2024-03-15
Template: Simple
Export: PDF
```
- Clean, professional client-facing report
- Shows project-specific expenses
- Ready to attach to invoice

## ⚠️ Important Notes

### Permissions:
- No special permissions needed for categories or reports
- PDF/CSV files are saved to your device
- You can share files through any app (email, cloud, etc.)

### Data:
- Reports include only YOUR expenses and mileage
- Date ranges are inclusive (both start and end dates included)
- Empty reports show "No Data" message

### Known Limitations:
- Company logo upload is not yet implemented
- Date picker is manual entry (no calendar widget yet)
- Reports are generated on-device (no cloud storage)

## 🔄 What's Next?

Optional future enhancements that could be added:
1. **Company Logo Upload**: Add your company logo to reports
2. **Calendar Date Picker**: Visual date selection
3. **Report Templates**: Save custom report configurations
4. **Scheduled Reports**: Automatic monthly reports
5. **Cloud Storage**: Auto-save reports to Dropbox/Google Drive
6. **Email Integration**: Email reports directly from app

## 🐛 Troubleshooting

### "No Data" in Reports
- Check your date range includes the dates of your expenses/trips
- Verify you have expenses or mileage trips in that period
- Try clicking "Preview Report" first to see what data will be included

### PDF Won't Open
- Make sure you have a PDF reader app installed
- Try using the "Share" function to save to Files app first
- On Android, try a different PDF viewer app

### CSV Not Recognized
- CSV files can be opened in Excel, Google Sheets, Numbers
- Try renaming file extension to .csv if needed
- Import into accounting software using "Import CSV" function

### Category Not Showing
- Refresh the expense screen (pull to refresh)
- New categories appear immediately in category list
- Check you're creating the category (not just typing and closing)

## 📞 Support

If you encounter issues:
1. Check this documentation first
2. Review the MILEAGE_SETUP.md for mileage-specific questions
3. Make sure your database schema is up to date
4. Verify all npm packages are installed correctly

---

**Ready to use!** Both Categories and Reports are fully functional. Start by creating some custom categories, then generate your first report!
