import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'

const dataDir = path.join(process.cwd(), 'data')
const collections = ['requests', 'trips', 'selections', 'extras', 'documents', 'followups'] as const

async function readCollection(collection: string) {
  if (!collections.includes(collection as (typeof collections)[number])) throw new Error('Unknown collection')
  const content = await fs.readFile(path.join(dataDir, `${collection}.json`), 'utf8')
  const normalized = content.replace(/^\uFEFF/, '')
  return JSON.parse(normalized)
}

export async function GET() {
  const [requests, trips, selections, extras, documents, followups] = await Promise.all(collections.map(readCollection))
  const hydratedTrips = trips.map((trip: { id: string }) => ({
    ...trip,
    extras: extras.filter((extra: { tripId: string }) => extra.tripId === trip.id),
    documents: documents.filter((document: { tripId: string }) => document.tripId === trip.id)
  }))

  return NextResponse.json({ requests, trips: hydratedTrips, selections, extras, documents, followups })
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { collection?: string; data?: unknown }

  if (!body.collection || !collections.includes(body.collection as (typeof collections)[number])) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 400 })
  }

  const file = path.join(dataDir, `${body.collection}.json`)
  const temp = `${file}.${process.pid}.tmp`
  await fs.writeFile(temp, JSON.stringify(body.data, null, 2) + '\n', 'utf8')
  await fs.rename(temp, file)

  if (body.collection === 'extras' || body.collection === 'documents') {
    const trips = await readCollection('trips')
    const related = (body.data as Array<{ tripId?: string }>).find((entry) => entry.tripId)
    const extras = body.collection === 'extras' ? body.data : await readCollection('extras')
    const documents = body.collection === 'documents' ? body.data : await readCollection('documents')
    const matchedTrip = trips.find((trip: { id: string }) => trip.id === related?.tripId)

    return NextResponse.json({
      ok: true,
      collection: body.collection,
      data: body.data,
      trip: matchedTrip
        ? {
            ...matchedTrip,
            extras: extras.filter((extra: { tripId: string }) => extra.tripId === matchedTrip.id),
            documents: documents.filter((document: { tripId: string }) => document.tripId === matchedTrip.id)
          }
        : undefined
    })
  }

  return NextResponse.json({ ok: true, collection: body.collection, data: body.data })
}
