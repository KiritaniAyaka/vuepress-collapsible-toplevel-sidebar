import type { PageHeader, Plugin } from 'vuepress'

/**
 * The plugin to convert top level sidebar to collapsible
 * @param path The path you want to control
 * @param sidebarPaths Paths on the sidebar
 * @returns Plugin object
 */
export function collapsibleTopLevelSidebar(path: string, sidebarPaths: string[], sidebarDepth = 3) {
	return <Plugin>{
		name: 'CollapsibleTopLevelSidebar',
		multiple: true,
		async onInitialized(app) {
			app.pages
				.filter(p => p.path.startsWith(path)) // all pages we want to control (edit their sidebar)
				.forEach((page, _index, pages) => {
					page.frontmatter = page.frontmatter ?? {}
					// current editing
					page.frontmatter.sidebar = sidebarPaths.map((sidebarPath) => {
					// objects of pages on the sidebar
						const pageOnSidebar = pages.find(p => p.path === `${path}${sidebarPath}.html`)
						if (!pageOnSidebar) {
							throw new Error(`Page '${path}${sidebarPath}.html' not found.`)
						}

						const children = headersToSidebar(pageOnSidebar.headers)

						if (children) {
							return {
								text: pageOnSidebar.title,
								collapsible: true,
								children,
							}
						}
						// if the page has no 2nd level header
						return {
							text: pageOnSidebar.title,
							link: pageOnSidebar.path,
						}

						/**
						 * convert headers objects to sidebar options that VuePress needs
						 */
						function headersToSidebar(headers: PageHeader[], depth = 1) {
							// skip top-level header
							headers = headers[0]?.level === 1 ? headers[0]?.children : headers

							if (!headers || headers.length < 1) {
								return
							}
							return headers.map(header => handleHeader(header))

							/**
							 * convert single header object to sidebar option
							 */
							function handleHeader(header: PageHeader) {
								let children
								if (header.children && header.children.length > 0 && depth < sidebarDepth) {
									children = headersToSidebar(header.children, depth + 1)
								}

								return {
									text: header.title,
									// should use relative hashtag link to avoid uncompatible problem to `activeHeaderLinks` plugin
									// active header plugin will use the path only has hashtag to judge if the page is active
									// see: https://github.com/vuepress/vuepress-next/blob/v2.0.0-beta.67/ecosystem/theme-default/src/client/utils/isActiveSidebarItem.ts#L9
									link: isCurrentPage() ?
										`#${header.slug}` :
										`/parts/${sidebarPath}.html#${header.slug}`,
									children,
								}
							}
						}

						/**
						 * if the current page is the sidebar link we want to render
						 */
						function isCurrentPage() {
							return page.path.replace(/\.html/g, '').endsWith(sidebarPath)
						}
					})
				})
		},
	}
}
