import { PrismaClient } from '@prisma/client'
import { defineEventHandler, readBody, getQuery, getRouterParam } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  try {
    // GET: Lấy tất cả topic
    if (method === 'GET') {
      return await prisma.topic.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    }

    // POST: Tạo topic mới
    if (method === 'POST') {
      const body = await readBody(event)
      if (!body.name || typeof body.name !== 'string') {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Invalid topic name' }),
        )
      }

      const created = await prisma.topic.create({
        data: {
          name: body.name,
        },
      })

      return created
    }

    // PUT: Cập nhật topic (yêu cầu query ?id=...)
    if (method === 'PUT') {
      const query = getQuery(event)
      const id = query.id as string
      const body = await readBody(event)

      if (!id || !body.name || typeof body.name !== 'string') {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Invalid input' }),
        )
      }

      const updated = await prisma.topic.update({
        where: { id },
        data: { name: body.name },
      })

      return updated
    }

    // DELETE: Xoá topic (yêu cầu query ?id=...)
    if (method === 'DELETE') {
      const query = getQuery(event)
      const id = query.id as string

      if (!id) {
        return sendError(
          event,
          createError({ statusCode: 400, statusMessage: 'Missing topic ID' }),
        )
      }

      const deleted = await prisma.topic.delete({
        where: { id },
      })

      return deleted
    }

    return sendError(
      event,
      createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }),
    )
  } catch (err: any) {
    return sendError(
      event,
      createError({ statusCode: 500, statusMessage: err.message }),
    )
  }
})
