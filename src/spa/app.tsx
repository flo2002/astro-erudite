import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  BookOpenText,
  BookCopy,
  CircleHelp,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Home,
  Info,
  LibraryBig,
  Mail,
  Tag,
  Tags,
  User,
  Users,
} from 'lucide-react'

import { SITE } from '@/consts'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getSiteData } from '@/spa/api'
import type { SpaPost, SpaSiteData } from '@/spa/types'
import { cn, formatDate, getHeadingMargin } from '@/lib/utils'

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
  return <div className="flex flex-col gap-y-6">{children}</div>
}

function HomePage({ data }: { data: SpaSiteData }) {
  const featured = data.posts.filter((post) => !post.isSubpost).slice(0, SITE.featuredPostCount)
  const authorLookup = new Map(data.authors.map((author) => [author.id, author]))

  return (
    <>
      <section className="rounded-lg border">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-3xl leading-none font-medium">er·u·dite</h3>
          <p className="text-muted-foreground text-sm">/ˈer(y)əˌdīt/ • <span className="font-medium">adjective</span></p>
        </div>
        <div className="p-6 pt-0">
          <p className="text-muted-foreground mb-2 text-sm">
            astro-erudite is an opinionated, unstyled static blogging template built with{' '}
            <a href="https://astro.build" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-[3px]">Astro</a>,{' '}
            <a href="https://tailwindcss.com" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-[3px]">Tailwind</a>, and{' '}
            <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-[3px]">shadcn/ui</a>. Extraordinarily loosely based on the{' '}
            <a href="https://astro-micro.vercel.app/" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-[3px]">Astro Micro</a> theme.
          </p>
          <p className="text-muted-foreground text-sm">
            To use this template, check out the{' '}
            <a href="https://github.com/jktrn/astro-erudite" target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-[3px]">GitHub</a>{' '}
            repository. To learn more about why this template exists, read this blog post:{' '}
            <Link to="/blog/the-state-of-static-blogs" className="text-foreground underline underline-offset-[3px]">The State of Static Blogs in 2024</Link>.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-y-4">
        <h2 className="text-2xl font-medium">Latest posts</h2>
        <ul className="flex flex-col gap-3">
          {featured.map((post) => (
            <PostListItem key={post.id} post={post} authorLookup={authorLookup} />
          ))}
        </ul>
        <div className="flex justify-center">
          <Link to="/blog" className="rounded-md border px-3 py-1.5 hover:bg-muted">
            See all posts <span className="ml-1.5">→</span>
          </Link>
        </div>
      </section>
    </>
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
  const authorLookup = new Map(data.authors.map((author) => [author.id, author]))

  const postsByYear = pagePosts.reduce<Record<string, SpaPost[]>>((acc, post) => {
    const year = new Date(post.date).getFullYear().toString()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(post)
    return acc
  }, {})

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <section className="flex flex-col gap-y-4">
      <SpaBreadcrumbs
        items={[
          { to: '/blog', label: 'Blog', icon: LibraryBig },
          { label: `Page ${safePage}`, icon: BookCopy },
        ]}
      />
      <div className="flex min-h-[calc(100vh-18rem)] flex-col gap-y-8">
        {years.map((year) => (
          <section key={year} className="flex flex-col gap-y-4">
            <div className="font-medium">{year}</div>
            <ul className="flex flex-col gap-3">
              {postsByYear[year].map((post) => (
                <PostListItem key={post.id} post={post} authorLookup={authorLookup} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {safePage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          {safePage > 1 ? (
            <Link className="rounded-md border px-3 py-1.5 hover:bg-muted" to={safePage - 1 === 1 ? '/blog' : `/blog/page/${safePage - 1}`}>
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

function PostListItem({
  post,
  authorLookup,
}: {
  post: SpaPost
  authorLookup: Map<string, SpaSiteData['authors'][number]>
}) {
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
            {post.authors.map((authorId) => {
              const author = authorLookup.get(authorId)
              if (!author) return null

              return (
                <span key={authorId} className="inline-flex items-center gap-1.5">
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="size-5 rounded-full"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span>{author.name}</span>
                </span>
              )
            })}
            {post.authors.length > 0 ? <span className="text-muted-foreground/60">|</span> : null}
            <span>{formatDate(new Date(post.date))}</span>
            <span className="text-muted-foreground/60">|</span>
            <span>{readTime}</span>
            {post.subpostCount > 0 ? (
              <>
                <span className="text-muted-foreground/60">|</span>
                <span>{post.subpostCount} subpost{post.subpostCount === 1 ? '' : 's'}</span>
              </>
            ) : null}
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

type SpaBreadcrumbEntry = {
  to?: string
  label: string
  icon?: LucideIcon
}

function SpaBreadcrumbs({ items }: { items: SpaBreadcrumbEntry[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">
              <Home className="size-4 shrink-0" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => {
          const Icon = item.icon
          const isLast = index === items.length - 1

          return (
            <div key={`${item.label}-${index}`} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast || !item.to ? (
                  <BreadcrumbPage>
                    <span className="flex items-center gap-x-2">
                      {Icon ? <Icon className="size-4 shrink-0" /> : null}
                      <span>{item.label}</span>
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>
                      <span className="flex items-center gap-x-2">
                        {Icon ? <Icon className="size-4 shrink-0" /> : null}
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function MobileOverviewHeader({
  headings,
  postTitle,
}: {
  headings: SpaPost['headings']
  postTitle: string
}) {
  const shouldRender =
    headings.length > 0 && !(headings.length === 1 && headings[0].text === postTitle)
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [currentSectionText, setCurrentSectionText] = useState('Overview')
  const [progress, setProgress] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    const headerOffset = 138

    const getHeadingElements = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '.spa-post-content h2, .spa-post-content h3, .spa-post-content h4, .spa-post-content h5, .spa-post-content h6',
        ),
      )

    const getVisibleIds = (elements: HTMLElement[]) => {
      const viewportTop = window.scrollY + headerOffset
      const viewportBottom = window.scrollY + window.innerHeight

      return elements
        .filter((heading) => {
          const top = heading.offsetTop
          const bottom = top + heading.offsetHeight
          return (
            (top >= viewportTop && top <= viewportBottom) ||
            (bottom >= viewportTop && bottom <= viewportBottom) ||
            (top <= viewportTop && bottom >= viewportBottom)
          )
        })
        .map((heading) => heading.id)
    }

    const update = () => {
      const elements = getHeadingElements()
      const visibleIds = getVisibleIds(elements)
      setActiveIds(visibleIds)

      const activeTexts = elements
        .filter((heading) => visibleIds.includes(heading.id) && heading.textContent)
        .map((heading) => heading.textContent!.trim())
      setCurrentSectionText(activeTexts.length > 0 ? activeTexts.join(', ') : 'Overview')

      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress =
        scrollableDistance > 0 ? Math.min(Math.max(window.scrollY / scrollableDistance, 0), 1) : 0
      setProgress(scrollProgress)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [shouldRender, postTitle])

  if (!shouldRender) {
    return null
  }

  const circumference = 2 * Math.PI * 10
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="w-full xl:hidden">
      <details className="group" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary className="flex w-full cursor-pointer items-center justify-between">
          <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-3">
            <div className="relative mr-2 size-4">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="text-primary/20"
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  className="text-primary"
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={circumference.toString()}
                  strokeDashoffset={dashOffset.toString()}
                  transform="rotate(-90 12 12)"
                />
              </svg>
            </div>
            <span className="text-muted-foreground flex-grow truncate text-sm">{currentSectionText}</span>
            <span className="text-muted-foreground ml-2">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div className="mx-auto max-w-3xl">
          <div className="max-h-[30vh] overflow-y-auto">
            <ul className="flex list-none flex-col gap-y-2 px-4 pb-4">
              {headings.map((heading) => (
                <li
                  key={heading.slug}
                  className={cn('px-4 text-sm text-foreground/60', getHeadingMargin(heading.depth))}
                >
                  <a
                    href={`#${heading.slug}`}
                    className={cn(
                      'underline decoration-transparent underline-offset-[3px] transition-colors duration-200 hover:decoration-inherit',
                      activeIds.includes(heading.slug) ? 'text-foreground' : '',
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}

function MobileSubpostsHeader({
  currentPost,
  parentPost,
  subposts,
}: {
  currentPost: SpaPost
  parentPost?: SpaPost
  subposts: SpaPost[]
}) {
  const rootPost = parentPost ?? currentPost
  const hasSubposts = subposts.length > 0

  if (!hasSubposts) {
    return null
  }

  return (
    <div className="w-full xl:hidden">
      <details className="group">
        <summary className="flex w-full cursor-pointer items-center justify-between">
          <div className="mx-auto flex w-full max-w-3xl items-center px-4 py-3">
            <BookOpenText className="mr-2 size-4 shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground flex-grow truncate text-sm">
              {currentPost.parentId ? currentPost.title : rootPost.title}
            </span>
            <span className="text-muted-foreground ml-2">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </div>
        </summary>

        <div className="mx-auto max-w-3xl px-4 pb-4">
          <ul className="flex max-h-[30vh] list-none flex-col gap-y-1 overflow-y-auto">
            <li>
              {currentPost.id === rootPost.id ? (
                <div className="bg-muted text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium">
                  <BookOpenText className="size-4 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-2">{rootPost.title}</span>
                </div>
              ) : (
                <Link
                  to={`/blog/${rootPost.id}#post-title`}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                >
                  <BookOpen className="size-4 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-2">{rootPost.title}</span>
                </Link>
              )}
            </li>

            {subposts.map((subpost) => (
              <li key={subpost.id} className="ml-4">
                {currentPost.id === subpost.id ? (
                  <div className="bg-muted text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium">
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-2">{subpost.title}</span>
                  </div>
                ) : (
                  <Link
                    to={`/blog/${subpost.id}`}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
                  >
                    <FileText className="size-4 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-2">{subpost.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  )
}

function DesktopTocSidebar({
  headings,
  postTitle,
}: {
  headings: SpaPost['headings']
  postTitle: string
}) {
  const shouldRender =
    headings.length > 0 && !(headings.length === 1 && headings[0].text === postTitle)

  if (!shouldRender) {
    return null
  }

  return (
    <aside className="sticky top-20 mr-auto ml-2 hidden h-[calc(100vh-5rem)] max-w-xs xl:block">
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex flex-col gap-2 px-4">
          <span className="text-lg font-medium">Table of Contents</span>
          <ul className="flex list-none flex-col gap-y-2">
            {headings.map((heading) => (
              <li
                key={heading.slug}
                className={cn('text-sm text-foreground/60', getHeadingMargin(heading.depth))}
              >
                <a
                  href={`#${heading.slug}`}
                  className="underline decoration-transparent underline-offset-[3px] transition-colors duration-200 hover:decoration-inherit"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}

function BlogPostPage({ data }: { data: SpaSiteData }) {
  const params = useParams()
  const postId = params['*'] || params.page || ''
  const post = data.posts.find((entry) => entry.id === postId)

  if (!post) {
    return <NotFoundPage />
  }

  const authorLookup = new Map(data.authors.map((author) => [author.id, author]))
  const parentPost = post.parentId ? data.posts.find((entry) => entry.id === post.parentId) : undefined
  const childPosts = data.posts
    .filter((entry) => entry.parentId === post.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const siblingSubposts = parentPost
    ? data.posts
        .filter((entry) => entry.parentId === parentPost.id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : childPosts
  const subpostsForNavigation = post.parentId ? siblingSubposts : childPosts
  const shouldRenderMobileToc =
    post.headings.length > 0 && !(post.headings.length === 1 && post.headings[0].text === post.title)
  const shouldRenderMobileSubposts = subpostsForNavigation.length > 0

  const breadcrumbItems: SpaBreadcrumbEntry[] = post.parentId && parentPost
    ? [
        { to: '/blog', label: 'Blog', icon: LibraryBig },
        { to: `/blog/${parentPost.id}`, label: parentPost.title, icon: BookOpen },
        { to: `/blog/${post.id}`, label: post.title, icon: FileText },
      ]
    : [
        { to: '/blog', label: 'Blog', icon: LibraryBig },
        { to: `/blog/${post.id}`, label: post.title, icon: BookOpenText },
      ]

  return (
    <div className="grid grid-cols-1 gap-y-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-x-6">
      <article className="flex min-w-0 flex-col gap-y-4">
        {(shouldRenderMobileSubposts || shouldRenderMobileToc) ? (
          <div className="bg-background/70 sticky top-14 z-40 -mx-4 border-y backdrop-blur-sm">
            {shouldRenderMobileSubposts ? (
              <MobileSubpostsHeader
                currentPost={post}
                parentPost={parentPost}
                subposts={subpostsForNavigation}
              />
            ) : null}
            {shouldRenderMobileToc ? (
              <MobileOverviewHeader headings={post.headings} postTitle={post.title} />
            ) : null}
          </div>
        ) : null}

        <SpaBreadcrumbs items={breadcrumbItems} />

      {post.image ? (
        <img src={post.image} alt={post.title} className="mx-auto w-full max-w-5xl object-cover" />
      ) : null}

      <div>
        <h2 className="text-2xl font-medium">{post.title}</h2>
        <div className="text-muted-foreground mt-2 text-sm">
          {post.authors.length > 0 ? (
            <>
              {post.authors.map((authorId, index) => {
                const author = authorLookup.get(authorId)
                if (!author) return null

                return (
                  <span key={authorId}>
                    {index > 0 ? ', ' : ''}
                    <Link to={`/authors/${authorId}`} className="hover:underline">
                      {author.name}
                    </Link>
                  </span>
                )
              })}
              <span> · </span>
            </>
          ) : null}
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
                <span className="inline-flex items-center gap-1">
                  <Hash className="size-3" />
                  {tag}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="spa-post-content prose max-w-none" dangerouslySetInnerHTML={{ __html: post.html }} />

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

      <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {post.adjacent.newer ? (
          <Link to={`/blog/${post.adjacent.newer}`} className="hover:underline">
            ← Newer
          </Link>
        ) : <span />}
        {post.adjacent.older ? (
          <Link to={`/blog/${post.adjacent.older}`} className="hover:underline">
            Older →
          </Link>
        ) : <span />}
      </div>
      </article>

      <DesktopTocSidebar headings={post.headings} postTitle={post.title} />
    </div>
  )
}

function BlogEntryPage({ data }: { data: SpaSiteData }) {
  const { page } = useParams()

  if (page && /^\d+$/.test(page)) {
    return <BlogListPage data={data} />
  }

  return <BlogPostPage data={data} />
}

function AuthorsPage({ data }: { data: SpaSiteData }) {
  const socialIconMap: Record<string, LucideIcon> = {
    Website: Globe,
    GitHub: ExternalLink,
    Twitter: ExternalLink,
    LinkedIn: ExternalLink,
    Email: Mail,
  }

  const getLinks = (author: SpaSiteData['authors'][number]) => {
    const links = [
      author.website ? { label: 'Website', href: author.website } : null,
      author.github ? { label: 'GitHub', href: author.github } : null,
      author.twitter ? { label: 'Twitter', href: author.twitter } : null,
      author.linkedin ? { label: 'LinkedIn', href: author.linkedin } : null,
      author.mail ? { label: 'Email', href: `mailto:${author.mail}` } : null,
    ]

    return links.filter((value): value is { label: string; href: string } => Boolean(value))
  }

  return (
    <section className="flex flex-col gap-y-4">
      <SpaBreadcrumbs items={[{ label: 'Authors', icon: Users }]} />
      <ul className="flex flex-col gap-4">
        {data.authors.map((author) => (
          <li key={author.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap gap-4">
              {author.avatar ? (
                <Link to={`/authors/${author.id}`} className="block">
                  <img
                    src={author.avatar}
                    alt={`Avatar of ${author.name}`}
                    className="size-32 rounded-md object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </Link>
              ) : null}
              <div className="flex grow flex-col justify-between gap-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-lg font-medium">{author.name}</span>
                    {author.pronouns ? <span className="text-muted-foreground text-sm">({author.pronouns})</span> : null}
                  </div>
                  {author.bio ? <p className="text-muted-foreground mt-2 text-sm">{author.bio}</p> : null}
                </div>
                <ul className="flex flex-wrap gap-2" role="list">
                  {getLinks(author).map((entry) => {
                    const Icon = socialIconMap[entry.label] ?? ExternalLink
                    return (
                      <li key={entry.label}>
                        <a
                          href={entry.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={entry.label}
                          title={entry.label}
                          className="inline-flex size-9 items-center justify-center rounded-md border hover:bg-muted"
                        >
                          <Icon className="size-4" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
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
  const authorLookup = new Map(data.authors.map((entry) => [entry.id, entry]))

  return (
    <>
      <SpaBreadcrumbs
        items={[
          { to: '/authors', label: 'Authors', icon: Users },
          { label: author.name, icon: User },
        ]}
      />
      <section>
        <div className="rounded-xl border p-4">
          <div className="flex flex-wrap gap-4">
            <img
              src={author.avatar}
              alt={`${author.name} avatar`}
              className="size-32 rounded-md object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex flex-wrap items-center gap-x-2">
                <h2 className="text-lg font-medium">{author.name}</h2>
                {author.pronouns ? <span className="text-muted-foreground text-sm">({author.pronouns})</span> : null}
              </div>
              {author.bio ? <p className="text-muted-foreground text-sm">{author.bio}</p> : null}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-4 flex flex-col gap-y-4">
        <h2 className="text-2xl font-medium">Posts by {author.name}</h2>
        {posts.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostListItem key={post.id} post={post} authorLookup={authorLookup} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No posts available from this author.</p>
        )}
      </section>
    </>
  )
}

function TagsPage({ data }: { data: SpaSiteData }) {
  return (
    <section className="flex flex-col gap-y-4">
      <SpaBreadcrumbs items={[{ label: 'Tags', icon: Tags }]} />
      <div className="flex flex-wrap gap-2 text-sm">
        {data.tags.map((entry) => (
          <Link key={entry.tag} to={`/tags/${entry.tag}`} className="bg-muted inline-flex items-center rounded-full px-3 py-1.5">
            <Hash className="mr-1 size-3" />
            {entry.tag}
            <span className="text-muted-foreground ml-1.5">({entry.count})</span>
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
  const authorLookup = useMemo(
    () => new Map(data.authors.map((author) => [author.id, author])),
    [data.authors],
  )

  if (!tag) {
    return <NotFoundPage />
  }

  return (
    <section className="flex flex-col gap-y-4">
      <SpaBreadcrumbs
        items={[
          { to: '/tags', label: 'Tags', icon: Tags },
          { label: tag, icon: Tag },
        ]}
      />
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <PostListItem key={post.id} post={post} authorLookup={authorLookup} />
        ))}
      </ul>
    </section>
  )
}

function AboutPage({ data }: { data: SpaSiteData }) {
  return (
    <section className="flex flex-col gap-y-4">
      <SpaBreadcrumbs items={[{ label: 'About', icon: Info }]} />
      <div className="prose mb-4">
        <p className="mt-0">
          astro-erudite is an opinionated, unstyled static blogging template that prioritizes simplicity and performance, built with{' '}
          <a href="https://astro.build" target="_blank" rel="noreferrer">Astro</a>,{' '}
          <a href="https://tailwindcss.com" target="_blank" rel="noreferrer">Tailwind</a>, and{' '}
          <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">shadcn/ui</a>. It provides a clean foundation for your content while being extremely easy to customize.
        </p>
        <p>
          To learn more about the philosophy behind this template, check out the following blog post:{' '}
          <Link to="/blog/the-state-of-static-blogs" className="underline underline-offset-[3px]">The State of Static Blogs in 2024</Link>.
        </p>
      </div>

      <h2 className="mb-1 text-2xl font-medium">Example Projects Listing</h2>
      <ul className="flex flex-col gap-3">
        {data.projects.map((project) => (
          <li key={project.id} className="hover:bg-muted/50 rounded-xl border p-4 transition-colors duration-300 ease-in-out">
            <a href={project.link} className="flex flex-col gap-4 sm:flex-row" target="_blank" rel="noreferrer">
              {project.image ? (
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full object-cover sm:max-w-3xs sm:shrink-0"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="grow">
                <h3 className="mb-1 text-lg font-medium">{project.name}</h3>
                <p className="text-muted-foreground mb-2 text-sm">{project.description}</p>
                {project.startDate ? (
                  <p className="text-muted-foreground/70 mb-2 inline-flex items-center gap-1.5 text-xs">
                    <span>{formatDate(new Date(project.startDate))}</span>
                    <span>{project.endDate ? `→ ${formatDate(new Date(project.endDate))}` : '→ Present'}</span>
                  </p>
                ) : null}
                {project.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="bg-muted rounded-md px-2 py-0.5 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function NotFoundPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-y-4 text-center">
      <SpaBreadcrumbs items={[{ label: '???', icon: CircleHelp }]} />
      <div className="max-w-md">
        <h2 className="mb-4 text-3xl font-medium">404: Page not found</h2>
        <p className="prose">Oops! The page you're looking for doesn't exist.</p>
      </div>
      <Link to="/" className="group flex gap-x-1.5 rounded-md border px-3 py-1.5 hover:bg-muted">
        <span className="transition-transform group-hover:-translate-x-1">←</span> Go to home page
      </Link>
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
      <Route path="/blog/:page" element={<BlogEntryPage data={data} />} />
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
