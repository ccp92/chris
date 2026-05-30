---
title: 'jj instead of git'
pubDate: 2026-05-28
description: 'A blog post on using jujutsu (jj) as an alternative to git'
author: 'Chris Parsons'
# image:
#     url: 'https://docs.astro.build/assets/rose.webp'
#     alt: 'The Astro logo on a dark background with a pink glow.'
tags: ["jj", "jujutsu", "learning in public"]
bskyPostUri: "https://bsky.app/profile/chrisparsons.dev/post/3mmx3anphy22d"
---

## What is jujutsu?
[jujutsu](https://www.jj-vcs.dev/latest/) (jj for short) is an alternative Version Control System (VCS) that can be used instead of git.

## Why jj?
I've been seeing a lot of interesting blog posts (such as [defeating git rigour fatigue with jujutsu by Ike Saunders](https://ikesau.co/blog/defeating-git-rigour-fatigue-with-jujutsu/)) espousing `jj`, and after looking into the documentation, it's pretty easy to run alongside git; meaning I can fall back onto a more familiar tool if I need to or get stuck.

I've also already been pretty invested in alternative VCSes, using [graphite](https://graphite.com) at work for building and managing stacked PRs. However, from what I've picked up so far from using jj, it feels like a lot of what is being managed by graphite should be pretty replicable with jj's tooling. It also feels good to be less reliant on a proprietary cli tool for my VCS. (Although I do ❤️ graphite's PR UI)

## Mentality shift
Typically, when using git, you'd have a local working environment and when you're finished, stage the changes into a commit and push the changes up to a remote origin. However, when using jj, you're always working inside of a commit, with jj automatically staging all of your changes as you go. You progress with your work by creating new empty commits to work in (using `jj new`) instead of staging and creating a snapshot of the repo at that point.

## What I still need to try
### Switching up my workflow
I've been reading through and pulling bits of info from Steve Klabnik's jujutsu tutorial and am very much still using the classic edit workflow from git. However, the creator of jujutsu suggests a "[squash workflow](https://steveklabnik.github.io/jujutsu-tutorial/real-world-workflows/the-squash-workflow.html)", where you create a base commit for the feature or work you're committing to and then create new commits on top of it.

Essentially, you create and describe a commit for a feature you're working on and then create an empty working copy over the top of it. As you finish slices of the work, you squash the changes from your working copy back down into the parent (using `jj squash`).

### Anonymous branches
Whilst jujutsu supports a similar workflow to git with the concept of bookmarks instead of branches, ultimately, the aim is to be more reliant on [anonymous branches](https://docs.jj-vcs.dev/latest/glossary/#anonymous-branch) instead. With the idea that any chain of commits diverging from main is a branch that doesn't even need to be named.

It feels like this combos well with the squash workflow I described above. Essentially the parent commit with the description of your feature becomes the "branch", allowing you to work on multiple features across multiple anonymous branches without having to spin up bookmarks.
