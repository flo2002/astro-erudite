import type { APIRoute } from 'astro'
import { render } from 'astro:content'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import mdxRenderer from '@astrojs/mdx/server.js'
import { SITE } from '@/consts'
import {
	getAdjacentPosts,
	getAllAuthors,
	getAllPostsAndSubposts,
	getAllProjects,
	getCombinedReadingTime,
	getPostReadingTime,
	getSortedTags,
	getSubpostCount,
	isSubpost,
} from '@/lib/data-utils'

let containerPromise: Promise<AstroContainer> | null = null

async function getContainer(): Promise<AstroContainer> {
	if (!containerPromise) {
		containerPromise = AstroContainer.create().then((container) => {
			container.addServerRenderer({ renderer: mdxRenderer })
			return container
		})
	}
	return containerPromise
}

function serializeImage(image: unknown): string | undefined {
	if (!image) return undefined
	if (typeof image === 'string') return image

	if (
		typeof image === 'object' &&
		image !== null &&
		'src' in image &&
		typeof (image as { src?: unknown }).src === 'string'
	) {
		return (image as { src: string }).src
	}

	return undefined
}

export const GET: APIRoute = async () => {
	const container = await getContainer()

	const [authors, posts, projects, tags] = await Promise.all([
		getAllAuthors(),
		getAllPostsAndSubposts(),
		getAllProjects(),
		getSortedTags(),
	])

	const serializedPosts = await Promise.all(
		posts.map(async (post) => {
			const postIsSubpost = isSubpost(post.id)
			const { Content, headings } = await render(post)
			const html = await container.renderToString(Content)
			const adjacent = await getAdjacentPosts(post.id)
			const readingTime = await getPostReadingTime(post.id)
			const combinedReadingTime = !postIsSubpost
				? await getCombinedReadingTime(post.id)
				: undefined
			const subpostCount = !postIsSubpost ? await getSubpostCount(post.id) : 0

			return {
				id: post.id,
				title: post.data.title,
				description: post.data.description,
				date: post.data.date.toISOString(),
				tags: post.data.tags ?? [],
				authors: post.data.authors ?? [],
				image: serializeImage(post.data.image),
				html,
				headings: headings.map((heading) => ({
					slug: heading.slug,
					text: heading.text,
					depth: heading.depth,
				})),
				isSubpost: postIsSubpost,
				parentId: postIsSubpost ? post.id.split('/')[0] : undefined,
				order: post.data.order,
				readingTime,
				combinedReadingTime,
				subpostCount,
				adjacent: {
					newer: adjacent.newer?.id,
					older: adjacent.older?.id,
					parent: adjacent.parent?.id,
				},
			}
		}),
	)

	const serializedAuthors = authors.map((author) => ({
		id: author.id,
		name: author.data.name,
		avatar: author.data.avatar,
		bio: author.data.bio,
		pronouns: author.data.pronouns,
		website: author.data.website,
		github: author.data.github,
		twitter: author.data.twitter,
		linkedin: author.data.linkedin,
		mail: author.data.mail,
	}))

	const serializedProjects = projects.map((project) => ({
		id: project.id,
		name: project.data.name,
		description: project.data.description,
		tags: project.data.tags,
		link: project.data.link,
		startDate: project.data.startDate?.toISOString(),
		endDate: project.data.endDate?.toISOString(),
		image: serializeImage(project.data.image),
	}))

	const routeSet = new Set<string>([
		'/',
		'/about',
		'/blog',
		'/authors',
		'/tags',
		'/404',
	])

	const parentPosts = serializedPosts.filter((post) => !post.isSubpost)
	const pageCount = Math.max(1, Math.ceil(parentPosts.length / SITE.postsPerPage))
	for (let page = 1; page <= pageCount; page++) {
		if (page > 1) {
			routeSet.add(`/blog/${page}`)
		}
		routeSet.add(`/blog/page/${page}`)
	}

	for (const post of serializedPosts) {
		routeSet.add(`/blog/${post.id}`)
	}

	for (const author of serializedAuthors) {
		routeSet.add(`/authors/${author.id}`)
	}

	for (const tag of tags) {
		routeSet.add(`/tags/${tag.tag}`)
	}

	const payload = {
		generatedAt: new Date().toISOString(),
		postsPerPage: SITE.postsPerPage,
		routes: Array.from(routeSet).sort((a, b) => a.localeCompare(b)),
		posts: serializedPosts,
		authors: serializedAuthors,
		projects: serializedProjects,
		tags,
	}

	return new Response(JSON.stringify(payload), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=0, must-revalidate',
		},
	})
}
