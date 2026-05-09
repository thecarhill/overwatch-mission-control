/**
 * GitHub REST URLs are `/repos/{owner}/{repo}/...` — `repo` must be the repo name only,
 * not a full https://github.com/... URL (that breaks fetch and surfaces as TypeError: Load failed).
 */

export function normalizeGithubOwnerRepo(
  ownerIn: string,
  repoIn: string,
): { owner: string; repo: string } {
  const owner = ownerIn.trim()
  let repo = repoIn.trim()

  const urlMatch = repo.match(
    /^https?:\/\/github\.com\/([^/?#]+)\/([^/?#]+)(?:\.git)?(?:\/|\?|#|$)/i,
  )
  if (urlMatch) {
    return { owner: urlMatch[1], repo: stripDotGit(urlMatch[2]) }
  }

  if (!repo.includes('://')) {
    const pair = repo.match(/^([^/]+)\/([^/]+)$/)
    if (pair) {
      return { owner: pair[1], repo: stripDotGit(pair[2]) }
    }
  }

  repo = repo.replace(/^\/+/, '').replace(/\/+$/, '')
  if (repo.includes('/') && !repo.includes('://')) {
    const segments = repo.split('/').filter(Boolean)
    repo = stripDotGit(segments[segments.length - 1] ?? repo)
  }

  repo = stripDotGit(repo)
  return { owner, repo }
}

function stripDotGit(name: string): string {
  return name.replace(/\.git$/i, '')
}
