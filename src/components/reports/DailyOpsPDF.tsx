'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface PropertyData {
  propertyName: string
  rooms: Array<{
    name: string
    type: string
    status: string
    guestName?: string | null
    guestCount?: number
    notes?: string | null
  }>
  maintenance: Array<{
    title: string
    priority: string
    status: string
    category: string
    room: string
  }>
}

interface SiteSettings {
  orgName: string
  orgTagline?: string | null
  reportFooter?: string | null
}

interface DailyOpsPDFProps {
  siteSettings: SiteSettings
  properties: PropertyData[]
  reportDate: string
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
  },
  orgName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tagline: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    marginTop: 10,
  },
  reportDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  propertySection: {
    marginBottom: 25,
  },
  propertyHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: '#0F172A',
  },
  statusOccupied: {
    color: '#2563EB',
  },
  statusVacant: {
    color: '#16A34A',
  },
  statusCheckout: {
    color: '#8B5CF6',
  },
  statusNoShow: {
    color: '#DC2626',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 15,
    marginBottom: 8,
  },
  maintenanceRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  maintenanceCell: {
    fontSize: 9,
    color: '#0F172A',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 9,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
})

function getStatusStyle(status: string) {
  switch (status) {
    case 'OCCUPIED': return styles.statusOccupied
    case 'VACANT': return styles.statusVacant
    case 'CHECKOUT': return styles.statusCheckout
    case 'NO_SHOW': return styles.statusNoShow
    default: return styles.tableCell
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'OCCUPIED': return 'Occupied'
    case 'VACANT': return 'Vacant'
    case 'CHECKOUT': return 'Checkout'
    case 'NO_SHOW': return 'No Show'
    default: return status
  }
}

function PropertyPage({ property, siteSettings, reportDate, pageNumber }: {
  property: PropertyData
  siteSettings: SiteSettings
  reportDate: string
  pageNumber: number
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.orgName}>{siteSettings.orgName}</Text>
        {siteSettings.orgTagline && (
          <Text style={styles.tagline}>{siteSettings.orgTagline}</Text>
        )}
        <Text style={styles.reportTitle}>Daily Operations Report</Text>
        <Text style={styles.reportDate}>Report Date: {reportDate}</Text>
      </View>

      <View style={styles.propertySection}>
        <Text style={styles.propertyHeader}>{property.propertyName}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Room</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Guest</Text>
          <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Count</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Notes</Text>
        </View>

        {(!property.rooms || property.rooms.length === 0) ? (
          <Text style={styles.emptyText}>No rooms data available</Text>
        ) : (
          property.rooms.map((room, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{room.name}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{room.type}</Text>
              <Text style={[styles.tableCell, { width: '15%' }, getStatusStyle(room.status)]}>
                {getStatusLabel(room.status)}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{room.guestName ?? '—'}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{room.guestCount ?? 0}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{room.notes ?? '—'}</Text>
            </View>
          ))
        )}
      </View>

      {property.maintenance && property.maintenance.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Maintenance Issues</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Title</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Priority</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Category</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Room</Text>
          </View>
          {property.maintenance.map((issue, i) => (
            <View key={i} style={styles.maintenanceRow}>
              <Text style={[styles.maintenanceCell, { width: '25%' }]}>{issue.title}</Text>
              <Text style={[styles.maintenanceCell, { width: '15%' }]}>{issue.priority}</Text>
              <Text style={[styles.maintenanceCell, { width: '15%' }]}>{issue.status}</Text>
              <Text style={[styles.maintenanceCell, { width: '15%' }]}>{issue.category}</Text>
              <Text style={[styles.maintenanceCell, { width: '15%' }]}>{issue.room}</Text>
            </View>
          ))}
        </View>
      )}

      {siteSettings.reportFooter && (
        <Text style={styles.footer}>{siteSettings.reportFooter}</Text>
      )}
      <Text style={styles.pageNumber}>Page {pageNumber}</Text>
    </Page>
  )
}

export function DailyOpsPDF({ siteSettings, properties, reportDate }: DailyOpsPDFProps) {
  if (!properties || properties.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.orgName}>{siteSettings.orgName}</Text>
            {siteSettings.orgTagline && (
              <Text style={styles.tagline}>{siteSettings.orgTagline}</Text>
            )}
            <Text style={styles.reportTitle}>Daily Operations Report</Text>
            <Text style={styles.reportDate}>Report Date: {reportDate}</Text>
          </View>
          <Text style={styles.emptyText}>No data available for the selected period.</Text>
          {siteSettings.reportFooter && (
            <Text style={styles.footer}>{siteSettings.reportFooter}</Text>
          )}
        </Page>
      </Document>
    )
  }

  return (
    <Document>
      {properties.map((property, index) => (
        <PropertyPage
          key={index}
          property={property}
          siteSettings={siteSettings}
          reportDate={reportDate}
          pageNumber={index + 1}
        />
      ))}
    </Document>
  )
}
