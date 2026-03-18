import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generateStatisticsReport = async (stats, users, events, projects) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, 210, 40, 'F')
  
  // Logo and Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('Science & Tech Club', 105, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'normal')
  doc.text('Statistical Report', 105, 30, { align: 'center' })
  
  // Date
  doc.setFontSize(10)
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Generated: ${currentDate}`, 105, 36, { align: 'center' })
  
  // Reset text color for body
  doc.setTextColor(0, 0, 0)
  
  let yPos = 50
  
  // === SECTION 1: Overview Statistics ===
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Club Overview', 14, yPos)
  yPos += 10
  
  doc.autoTable({
    startY: yPos,
    head: [['Metric', 'Count']],
    body: [
      ['Total Members', stats.total_users || 0],
      ['Committee Members', stats.committee_members || 0],
      ['Active Students', stats.active_students || 0],
      ['Faculty Members', stats.faculty_count || 0],
      ['Total Events', stats.total_events || 0],
      ['Total Projects', stats.total_projects || 0]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14 }
  })
  
  yPos = doc.lastAutoTable.finalY + 15
  
  // === SECTION 2: Department Breakdown ===
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Department Distribution', 14, yPos)
  yPos += 10
  
  const departments = ['CSE', 'AIML', 'CSD', 'IT', 'CME', 'Civil', 'Mech', 'ECE', 'EEE']
  const deptCounts = departments.map(dept => {
    const count = users.filter(u => u.department === dept && u.role === 'student').length
    return [dept, count]
  }).filter(([dept, count]) => count > 0)
  
  if (deptCounts.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Department', 'Students']],
      body: deptCounts,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 14 }
    })
    yPos = doc.lastAutoTable.finalY + 15
  }
  
  // === SECTION 3: Year-wise Distribution ===
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Year-wise Student Distribution', 14, yPos)
  yPos += 10
  
  const yearCounts = [1, 2, 3, 4].map(year => {
    const count = users.filter(u => u.year === year && u.role === 'student').length
    return [`Year ${year}`, count]
  }).filter(([year, count]) => count > 0)
  
  if (yearCounts.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Year', 'Students']],
      body: yearCounts,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14 }
    })
    yPos = doc.lastAutoTable.finalY + 15
  }
  
  // === SECTION 4: Committee Members ===
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Committee Members', 14, yPos)
  yPos += 10
  
  const committeeMembers = users
    .filter(u => u.is_committee && u.committee_post)
    .map(u => [
      u.full_name || u.username,
      u.committee_post,
      u.department || '-'
    ])
  
  if (committeeMembers.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Name', 'Position', 'Department']],
      body: committeeMembers,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 14 }
    })
    yPos = doc.lastAutoTable.finalY + 15
  }
  
  // === SECTION 5: Recent Events ===
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Recent Events', 14, yPos)
  yPos += 10
  
  const recentEvents = events
    .slice(0, 10)
    .map(e => [
      e.title,
      e.status || 'upcoming',
      e.event_date ? new Date(e.event_date).toLocaleDateString('en-IN') : '-'
    ])
  
  if (recentEvents.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Event Title', 'Status', 'Date']],
      body: recentEvents,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 14 }
    })
    yPos = doc.lastAutoTable.finalY + 15
  }
  
  // === SECTION 6: Projects Summary ===
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('Projects Overview', 14, yPos)
  yPos += 10
  
  const projectsByStatus = [
    ['Active', projects.filter(p => p.status === 'active').length],
    ['Completed', projects.filter(p => p.status === 'completed').length],
    ['On Hold', projects.filter(p => p.status === 'on_hold').length]
  ].filter(([status, count]) => count > 0)
  
  if (projectsByStatus.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Status', 'Count']],
      body: projectsByStatus,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 }
    })
  }
  
  // Footer on last page
  const pageCount = doc.internal.getNumberOfPages()
  doc.setFontSize(10)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Page ${pageCount} | Generated by Science & Tech Club Admin Panel`,
    105,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  )
  
  // Save the PDF
  const fileName = `Club_Statistics_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
