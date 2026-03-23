import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'

import { NAV_LINKS, SITE } from '@/consts'
import { getSiteData } from '@/spa/api'
import type { SpaPost, SpaSiteData } from '@/spa/types'
import { formatDate } from '@/lib/utils'

type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SpaSiteData }

function useSpaData(): DataState {
  const [state, setState] = useState<DataState>({ status: 'loading' })

  useEffect(() => {
    let mounted = true

    getSiteData()
      .then((data) => {
        if (mounted) {
          setState({ status: 'ready', data })
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return state
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="rounded-lg border p-4">
        <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
          SPA Migration Preview
        </div>
        <h1 className="text-2xl font-medium">{SITE.title} client-first app</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This route is the first implementation milestone for the React SPA variant.
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <NavLink to="/" end className="rounded-md border px-3 py-1.5 hover:bg-muted">
          home
        </NavLink>
        {NAV_LINKS.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {children}
    </div>
  )
}

function HomePage({ data }: { data: SpaSiteData }) {
  const featured = data.posts.filter((post) => !post.isSubpost).slice(0, SITE.featuredPostCount)

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">Latest posts</h2>
      <ul className="flex flex-col gap-3">
        {featured.map((post) => (
          <PostListItem key={post.id} post={post} />
        ))}
      </ul>
    </section>
  )
}

function BlogListPage({ data }: { data: SpaSiteData }) {
  const params = useParams()
  const page = Number(params.page || '1')
  const currentPage = Number.isNaN(page) || page < 1 ? 1 : page
  const allPosts = data.posts.filter((post) => !post.isSubpost)
  const totalPages = Math.max(1, Math.ceil(allPosts.length / data.postsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * data.postsPerPage
  const pagePosts = allPosts.slice(start, start + data.postsPerPage)

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">Blog</h2>
      <ul className="flex flex-col gap-3">
        {pagePosts.map((post) => (
          <PostListItem key={post.id} post={post} />
        ))}
      </ul>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {safePage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          {safePage > 1 ? (
            <Link className="rounded-md border px-3 py-1.5 hover:bg-muted" to={`/blog/page/${safePage - 1}`}>
              Previous
            </Link>
          ) : (
            <span className="text-muted-foreground rounded-md border px-3 py-1.5">Previous</span>
          )}
          {safePage < totalPages ? (
            <Link className="rounded-md border px-3 py-1.5 hover:bg-muted" to={`/blog/page/${safePage + 1}`}>
              Next
            </Link>
          ) : (
            <span className="text-muted-foreground rounded-md border px-3 py-1.5">Next</span>
          )}
        </div>
      </div>
    </section>
  )
}

function PostListItem({ post }: { post: SpaPost }) {
  const readTime = post.combinedReadingTime ?? post.readingTime

  return (
    <li className="hover:bg-muted/50 rounded-xl border p-4 transition-colors duration-300 ease-in-out">
      <Link to={`/blog/${post.id}`} className="flex flex-col gap-4 sm:flex-row">
        {post.image ? (
          <div className="w-full overflow-hidden sm:max-w-3xs sm:shrink-0">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className="grow">
          <h3 className="mb-1 text-lg font-medium">{post.title}</h3>
          <p className="text-muted-foreground mb-2 text-sm">{post.description}</p>

          <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-2 text-xs">
            <span>{formatDate(new Date(post.date))}</span>
            <span className="text-muted-foreground/60">|</span>
            <span>{readTime}</span>
          </div>

          {post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  )
}

function BlogPostPage({ data }: { data: SpaSiteData }) {
  const params = useParams()
  const postId = params['*'] || ''
  const post = data.posts.find((entry) => entry.id === postId)

  if (!post) {
    return <NotFoundPage />
  }

  const authorLookup = new Map(data.authors.map((author) => [author.id, author]))
  const childPosts = data.posts
    .filter((entry) => entry.parentId === post.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <article className="flex flex-col gap-y-4">
      <div>
        <h2 className="text-2xl font-medium">{post.title}</h2>
        <div className="text-muted-foreground mt-2 text-sm">
          <span>{formatDate(new Date(post.date))}</span>
          <span> · </span>
          <span>{post.readingTime}</span>
          {post.combinedReadingTime && post.combinedReadingTime !== post.readingTime ? (
            <>
              <span> · </span>
              <span>{post.combinedReadingTime} total</span>
            </>
          ) : null}
        </div>
        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {post.tags.map((tag) => (
              <Link key={tag} to={`/tags/${tag}`} className="bg-muted rounded-full px-2 py-1">
                #{tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {post.authors.length > 0 ? (
        <div className="text-muted-foreground text-sm">
          {post.authors.map((authorId, index) => {
            const author = authorLookup.get(authorId)
            const name = author?.name ?? authorId
            return (
              <span key={authorId}>
                {index > 0 ? ', ' : ''}
                <Link to={`/authors/${authorId}`} className="hover:underline">
                  {name}
                </Link>
              </span>
            )
          })}
        </div>
      ) : null}

      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.html }} />

      {childPosts.length > 0 ? (
        <section className="flex flex-col gap-y-2">
          <h3 className="text-lg font-medium">Subposts</h3>
          <ul className="flex flex-col gap-2">
            {childPosts.map((child) => (
              <li key={child.id}>
                <Link to={`/blog/${child.id}`} className="hover:underline">
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}

function AuthorsPage({ data }: { data: SpaSiteData }) {
  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">Authors</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.authors.map((author) => (
          <li key={author.id} className="rounded-lg border p-4">
            <Link to={`/authors/${author.id}`} className="font-medium hover:underline">
              {author.name}
            </Link>
            {author.bio ? <p className="text-muted-foreground mt-2 text-sm">{author.bio}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function AuthorDetailPage({ data }: { data: SpaSiteData }) {
  const { authorId } = useParams()
  const author = data.authors.find((entry) => entry.id === authorId)

  if (!author) {
    return <NotFoundPage />
  }

  const posts = data.posts.filter((post) => post.authors.includes(author.id) && !post.isSubpost)

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">{author.name}</h2>
      {author.bio ? <p className="text-muted-foreground">{author.bio}</p> : null}
      <ul className="flex flex-col gap-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/blog/${post.id}`} className="hover:underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TagsPage({ data }: { data: SpaSiteData }) {
  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">Tags</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {data.tags.map((entry) => (
          <Link key={entry.tag} to={`/tags/${entry.tag}`} className="bg-muted rounded-full px-3 py-1.5">
            #{entry.tag} ({entry.count})
          </Link>
        ))}
      </div>
    </section>
  )
}

function TagDetailPage({ data }: { data: SpaSiteData }) {
  const { tag } = useParams()
  const posts = useMemo(
    () => data.posts.filter((post) => post.tags.includes(tag ?? '') && !post.isSubpost),
    [data.posts, tag],
  )

  if (!tag) {
    return <NotFoundPage />
  }

  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">Tag: {tag}</h2>
      <ul className="flex flex-col gap-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/blog/${post.id}`} className="hover:underline">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AboutPage({ data }: { data: SpaSiteData }) {
  return (
    <section className="flex flex-col gap-y-4">
      <h2 className="text-xl font-medium">About</h2>
      <p className="text-muted-foreground text-sm">
        SPA migration mode is active. This page uses static JSON manifests instead of Astro page-level content rendering.
      </p>
      <h3 className="text-lg font-medium">Projects</h3>
      <ul className="flex flex-col gap-3">
        {data.projects.map((project) => (
          <li key={project.id} className="rounded-lg border p-4">
            <a href={project.link} className="font-medium hover:underline" target="_blank" rel="noreferrer">
              {project.name}
            </a>
            <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NotFoundPage() {
  return (
    <section className="rounded-lg border p-6">
      <h2 className="text-xl font-medium">Not found</h2>
      <p className="text-muted-foreground mt-2 text-sm">The route does not exist in the current SPA route manifest.</p>
    </section>
  )
}

function SpaRoutes({ data }: { data: SpaSiteData }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage data={data} />} />
      <Route path="/about" element={<AboutPage data={data} />} />
      <Route path="/blog" element={<BlogListPage data={data} />} />
      <Route path="/blog/page/:page" element={<BlogListPage data={data} />} />
      <Route path="/blog/*" element={<BlogPostPage data={data} />} />
      <Route path="/authors" element={<AuthorsPage data={data} />} />
      <Route path="/authors/:authorId" element={<AuthorDetailPage data={data} />} />
      <Route path="/tags" element={<TagsPage data={data} />} />
      <Route path="/tags/:tag" element={<TagDetailPage data={data} />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

type SpaAppProps = {
  basename?: string
}

export function SpaApp({ basename = '/' }: SpaAppProps) {
  const state = useSpaData()

  return (
    <BrowserRouter basename={basename}>
      <AppLayout>
        {state.status === 'loading' ? <p className="text-muted-foreground text-sm">Loading SPA content...</p> : null}
        {state.status === 'error' ? (
          <p className="text-destructive text-sm">Failed to load SPA content: {state.message}</p>
        ) : null}
        {state.status === 'ready' ? <SpaRoutes data={state.data} /> : null}
      </AppLayout>
    </BrowserRouter>
  )
}
