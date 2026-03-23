export type SpaAuthor = {
  id: string
  name: string
  avatar: string
  bio?: string
}

export type SpaProject = {
  id: string
  name: string
  description: string
  tags: string[]
  link: string
  startDate?: string
  endDate?: string
  image?: string
}

export type SpaPost = {
  id: string
  title: string
  description: string
  date: string
  tags: string[]
  authors: string[]
  image?: string
  html: string
  headings: {
    slug: string
    text: string
    depth: number
  }[]
  isSubpost: boolean
  parentId?: string
  order?: number
  readingTime: string
  combinedReadingTime?: string
  subpostCount: number
  adjacent: {
    newer?: string
    older?: string
    parent?: string
  }
}

export type SpaTag = {
  tag: string
  count: number
}

export type SpaSiteData = {
  generatedAt: string
  postsPerPage: number
  routes: string[]
  posts: SpaPost[]
  authors: SpaAuthor[]
  projects: SpaProject[]
  tags: SpaTag[]
}
