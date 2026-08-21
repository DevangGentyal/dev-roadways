import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

const dataDir = path.join(process.cwd(), 'data')
const collections = ['trips', 'clients', 'selections', 'extras', 'documents', 'followups', 'fuel-transactions', 'drivers', 'vehicles'] as const

async function readCollection(collection: string) {
  if (!collections.includes(collection as (typeof collections)[number])) throw new Error('Unknown collection')
  try {
    const content = await fs.readFile(path.join(dataDir, `${collection}.json`), 'utf8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function GET() {
  const [trips, clients, selections, extras, documents, followups, fuelTransactions, drivers, vehicles] = await Promise.all(collections.map(readCollection))
  const documentsMap = new Map((documents as Array<{ id: string }>).map((d) => [d.id, d]))
  const hydratedTrips = (trips as any[]).map((trip) => {
    const docsByTripId = (documents as any[]).filter((doc) => doc.tripId === trip.id)
    const docIdsFromTrip = (Array.isArray(trip.documents) ? trip.documents : []).map((d: any) => (typeof d === 'string' ? d : d?.id)).filter(Boolean)
    const docsByDocIds = docIdsFromTrip.map((id: string) => documentsMap.get(id)).filter(Boolean)
    const tripDocs = Array.from(new Map([...docsByTripId, ...docsByDocIds].map((d) => [d.id, d])).values())

    return {
      ...trip,
      extras: (extras as any[]).filter((extra) => extra.tripId === trip.id),
      documents: tripDocs,
    }
  })
  return NextResponse.json({ trips: hydratedTrips, clients, selections, extras, documents, followups, fuelTransactions, drivers, vehicles })
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { collection?: string; data?: unknown }
    if (!body.collection || !collections.includes(body.collection as (typeof collections)[number])) {
      return NextResponse.json({ error: 'Unknown collection' }, { status: 400 })
    }
    const file = path.join(dataDir, `${body.collection}.json`)

    let dataToSave = body.data
    if (body.collection === 'trips' && Array.isArray(body.data)) {
      dataToSave = (body.data as any[]).map((t) => ({
        ...t,
        documents: Array.isArray(t.documents)
          ? t.documents.map((d: any) => (typeof d === 'string' ? d : d.id)).filter(Boolean)
          : [],
      }))
    } else if (body.collection === 'documents' || body.collection === 'extras') {
      const existing = (await readCollection(body.collection)) as Array<{ id: string }>
      const incoming = Array.isArray(body.data) ? (body.data as Array<{ id: string }>) : [body.data as { id: string }]
      const existingMap = new Map(existing.map((item) => [item.id, item]))
      for (const item of incoming) {
        if (item && item.id) {
          existingMap.set(item.id, item)
        }
      }
      dataToSave = Array.from(existingMap.values())
    }

    await fs.writeFile(file, JSON.stringify(dataToSave, null, 2) + '\n', 'utf8')

    if (body.collection === 'documents') {
      const rawTrips = (await readCollection('trips')) as any[]
      const updatedTrips = rawTrips.map((t) => {
        const matchingDocIds = (dataToSave as any[])
          .filter((d: any) => d.tripId === t.id)
          .map((d: any) => d.id)
        const existingDocIds = (Array.isArray(t.documents) ? t.documents : []).map((d: any) => (typeof d === 'string' ? d : d?.id)).filter(Boolean)
        const combinedDocIds = Array.from(new Set([...existingDocIds, ...matchingDocIds]))
        return { ...t, documents: combinedDocIds }
      })
      await fs.writeFile(path.join(dataDir, 'trips.json'), JSON.stringify(updatedTrips, null, 2) + '\n', 'utf8')
    }

    if (body.collection === 'extras' || body.collection === 'documents') {
      const rawTrips = await readCollection('trips')
      const related = Array.isArray(body.data)
        ? (body.data as Array<{ tripId?: string }>).find((entry) => entry?.tripId)
        : (body.data as { tripId?: string })
      const extras = body.collection === 'extras' ? dataToSave : await readCollection('extras')
      const documents = body.collection === 'documents' ? dataToSave : await readCollection('documents')
      const rawTrip = (rawTrips as any[]).find((item: { id: string }) => item.id === related?.tripId)
      
      const documentsMap = new Map((documents as any[]).map((d: { id: string }) => [d.id, d]))
      let tripDocs: any[] = []
      if (rawTrip) {
        const docsByTripId = (documents as any[]).filter((doc: any) => doc.tripId === rawTrip.id)
        const docIdsFromTrip = (Array.isArray(rawTrip.documents) ? rawTrip.documents : []).map((d: any) => (typeof d === 'string' ? d : d?.id)).filter(Boolean)
        const docsByDocIds = docIdsFromTrip.map((id: string) => documentsMap.get(id)).filter(Boolean)
        tripDocs = Array.from(new Map([...docsByTripId, ...docsByDocIds].map((d) => [d.id, d])).values())
      }

      return NextResponse.json({
        ok: true,
        collection: body.collection,
        data: dataToSave,
        trip: rawTrip
          ? {
              ...rawTrip,
              extras: (extras as Array<{ tripId: string }>).filter((extra) => extra.tripId === rawTrip.id),
              documents: tripDocs,
            }
          : undefined,
      })
    }
    return NextResponse.json({ ok: true, collection: body.collection, data: body.data })
  } catch (err: any) {
    console.error('Mock DB PUT Error:', err)
    return NextResponse.json({ error: err?.message || 'Mock DB Write Error' }, { status: 500 })
  }
}
