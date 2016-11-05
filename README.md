# Bell Schedule

A clean bell schedule web application for Harker students

## Usage
* Go to [the Github IO page](http://harkerdev.github.io/bellschedule/) to access the schedule
* Click the left and right arrows to switch between weeks
* Periods are highlighted as the day progresses
* Time left until the current period is over is displayed in small, bold text underneath the general period title

## How to Contribute

###TL; DR
1. **Check the To Do Section**: choose a pending task that hasn't yet been completed from the issues page and help us add that functionality to the schedule
2. **Fork this Repository**: fork either the main or development branches to your account
3. **Make the Changes**: make proposed changes on your fork
4. **Submit a Pull Request**: submit a pull request, then we'll review the changes and accept them if applicable

###Detailed Guide

1. **Fork project** (click upper right "Fork" button)
2. **Goto your fork**, (lower right, SSH clone url)
![git clone url](https://cloud.githubusercontent.com/assets/928812/2546957/26d189f6-b646-11e3-80e5-3659c5e1ed43.png)
3. Open a Terminal. "**git clone**" a local copy off your own fork.
```git clone git@github.com:mananshah99/bellschedule.git```
4. **Create a branch**. You can call it anything, for example "fix timer".
```git checkout -b fix_timer```
5. Make your changes to the file(s) in your newly created branch.
6. **Commit** your changes. ```git commit -a```
7. **Push your branch** to your github repo (which is a fork of HarkerDev/bellschedule).
```git push origin fix_timer```
8. Browse to your github repo and click on the green "**Compare & pull request**"
9. After your PR gets accepted you can **delete your branch**. (A grey button will show up in the closed PR. You can get to it from your Github notifications).

If you mess up, you can delete your branch on Github.
```git push origin :fix_timer```
Then on your local repo, in that same fix_timer branch, you can make your new changes and do a ```git commit --amend``` when you are done.
Then finish with Step 7 and 8.

To keep the master branch of your Github fork (and your local master branch as well) up to date with HarkerDev/bellschedule, do the following:
```
git remote add HarkerDev https://github.com/HarkerDev/bellschedule.git
git checkout master
git pull HarkerDev master
git push origin master
```

So let's assume, I had done a clone of HarkerDev/bellschedule a couple weeks ago but since then, there had been changes committed to the master branch. Because of this, both my local repository as well as **my** Github fork of vHarkerDev/bellschedule are both lagging behind by a number of commits. Let's catch up (fast-forward) to where the latest commit of HarkerDev/bellschedule is **before** we apply our own changes.

`cd bellschedule` (go to your local repo)

`git checkout master` (make sure you are on master branch)

`git pull HarkerDev master` (pull changes from vhf and merge them to your local repo)

`git push origin master` (push our now updated local repo to your github fork so that it is updated as well)

Now that you are completely up to date, you can jump to Step 4 (above). If these steps aren't taken, then @mananshah99 may run into merge conflicts when trying to add your contribution (not as easy as 1 click merge, when there's no conflicts).

Inspired by, and derived from [this wiki page](https://github.com/vhf/free-programming-books/wiki/Creating-good-Pull-Requests)


## Founders and Primary Contributors
* [Brian Chan](http://github.com/iluvredwall)
* [Manan Shah](http://github.com/mananshah99)
* [Andrew Tierno](http://github.com/andrew-tierno)
