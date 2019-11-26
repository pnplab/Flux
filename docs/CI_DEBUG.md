## fatal: tag \'vx.y.z\' already exists

Happens when you rewrite history and the commit associated with the last tag
disappear. Semantic-release is no longer able to diff from last release 
version because the commit is no longer in the branch even though the tag
exist.

https://github.com/semantic-release/semantic-release/issues/880#issuecomment-410308200


Remove tags both from github repo:

```bash
git push origin :vx.y.z
```

And gitlab repo!
https://gitlab.com/pnplab/Flux/-/tags

