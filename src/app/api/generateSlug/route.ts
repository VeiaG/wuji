import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Get current user from auth
    const { user: currentUser } = await payload.auth({
      headers: request.headers,
    })

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, currentUserId } = body

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ 
        error: 'Slug is required' 
      }, { status: 400 })
    }

    const baseSlug = slug.trim().toLowerCase()
    
    // Check if currentUserId is provided and valid
    const excludeUserId = currentUserId || currentUser.id

    // Function to check if slug exists (excluding current user)
    const checkSlugExists = async (testSlug: string): Promise<boolean> => {
      const existingUser = await payload.find({
        collection: 'users',
        where: {
          and: [
            {
              slug: {
                equals: testSlug,
              },
            },
            {
              id: {
                not_equals: excludeUserId,
              },
            },
          ],
        },
        limit: 1,
      })

      return existingUser.docs.length > 0
    }

    // Check if base slug is available
    let uniqueSlug = baseSlug
    let counter = 1

    // Keep trying with incremental numbers until we find a unique slug
    while (await checkSlugExists(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`
      counter++
      
      // Safety check to prevent infinite loops (though unlikely with random usernames)
      if (counter > 1000) {
        return NextResponse.json({ 
          error: 'Unable to generate unique slug' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      slug: uniqueSlug,
      wasModified: uniqueSlug !== baseSlug,
    })

  } catch (error) {
    console.error('Error generating unique slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}