import log from './logger';
import rx from 'rx';

const allBuilds = [ ];
const allPrs = { };
const prIncludes = { };
const prIncluded = { };
const submoduleRepos = new Set();
const submoduleBuilds = { };
export const watchedRepos = new rx.Subject();

export function addBuildConfig(buildConfig) {
	log.debug(`Adding Leeroy config ${buildConfig.id} for ${buildConfig.repo.id}`);
	
	allBuilds.push(buildConfig);
	
	for (const submodule in buildConfig.submodules) {
		const id = `${submodule}/${buildConfig.submodules[submodule]}`;
		submoduleBuilds[id] = submoduleBuilds[id] || [];
		submoduleBuilds[id].push(buildConfig);

		if (!submoduleRepos.has(submodule)) {
			submoduleRepos.add(submodule);
			watchedRepos.onNext(submodule);
		}
	}
}

export function addPullRequest(pr) {
	if (!allPrs[pr.id])
		allPrs[pr.id] = pr;
	else
		pr = allPrs[pr.id];
	log.debug(`Added ${pr.id}.`);
	return pr;
}

export function addPullRequestDependency(parent, child) {
	log.info(`Adding link from ${parent} to ${child}`);
	prIncludes[parent] = prIncludes[parent] || [];
	prIncludes[parent].push(child);
	prIncluded[child] = prIncluded[child] || [];
	prIncluded[child].push(parent);
}

function walkGraph(edges, id) {
	const results = new Set();
	const queue = [ id ];
	while (queue.length) {
		const nextId = queue.shift();
		results.add(nextId);
		queue.push(...(edges[nextId] || []));
	}
	return results;
}

export function getIncludedPrs(prId) {
	return walkGraph(prIncludes, prId).values();
}

export function getIncludingPrs(prId) {
	const including = walkGraph(prIncluded, prId);
	including.delete(prId);
	return including.values();
}

export function getPr(prId) {
	return allPrs[prId];
}

export function getPrBuilds(pr) {
	return submoduleBuilds[pr.base.id] || [];
}
