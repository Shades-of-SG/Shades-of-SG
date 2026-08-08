const { Op } = require('sequelize');
const {
    GameScore, RhythmBeatmap, Song, User, UserProfile,
} = require('../models');

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const PERIODS = ['all-time', 'weekly', 'monthly'];

function numericAccuracy(value) {
    const accuracy = Number(value);
    return Number.isFinite(accuracy) ? accuracy : -1;
}

function compareScores(left, right) {
    if (Number(right.score) !== Number(left.score)) return Number(right.score) - Number(left.score);
    if (numericAccuracy(right.accuracy) !== numericAccuracy(left.accuracy)) {
        return numericAccuracy(right.accuracy) - numericAccuracy(left.accuracy);
    }
    const achievedDifference = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    if (achievedDifference) return achievedDifference;
    return String(left.id).localeCompare(String(right.id));
}

function periodStart(period, now = new Date()) {
    if (period === 'weekly') return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    if (period === 'monthly') return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    return null;
}

function gradeFor(score) {
    if (score.rank) return score.rank;
    const accuracy = numericAccuracy(score.accuracy);
    if (accuracy >= 95) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    return 'C';
}

async function listLeaderboardSongs() {
    const beatmaps = await RhythmBeatmap.findAll({
        attributes: ['difficulty'],
        include: [{
            model: Song,
            as: 'song',
            attributes: ['id', 'title', 'artist', 'coverImageUrl'],
            required: true,
            where: { status: 'PUBLISHED' },
        }],
        where: { status: 'PUBLISHED' },
    });
    const songsById = new Map();
    beatmaps.forEach((beatmap) => {
        if (!beatmap.song || !DIFFICULTIES.includes(beatmap.difficulty)) return;
        const song = songsById.get(beatmap.song.id) || {
            artist: beatmap.song.artist || '',
            coverImageUrl: beatmap.song.coverImageUrl || '',
            difficulties: [],
            id: beatmap.song.id,
            title: beatmap.song.title,
        };
        if (!song.difficulties.includes(beatmap.difficulty)) song.difficulties.push(beatmap.difficulty);
        songsById.set(song.id, song);
    });
    return [...songsById.values()]
        .map((song) => ({
            ...song,
            difficulties: song.difficulties.sort((left, right) => DIFFICULTIES.indexOf(left) - DIFFICULTIES.indexOf(right)),
        }))
        .sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
}

async function loadOfficialScores(where = {}) {
    return GameScore.findAll({
        attributes: ['id', 'userId', 'songId', 'score', 'accuracy', 'difficulty', 'rank', 'maxCombo', 'createdAt'],
        include: [
            {
                model: Song,
                as: 'song',
                attributes: ['id', 'title', 'coverImageUrl'],
                required: true,
                where: { status: 'PUBLISHED' },
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name'],
                include: [{
                    model: UserProfile,
                    as: 'profile',
                    attributes: ['avatarUrl', 'displayName', 'profileVisibility', 'showRhythmRanking'],
                    required: false,
                }],
                required: true,
                where: { accountStatus: 'ACTIVE', role: { [Op.in]: ['REGISTERED', 'CREATOR'] } },
            },
        ],
        where,
    });
}

function bestScorePerUser(scores) {
    const best = new Map();
    [...scores].sort(compareScores).forEach((score) => {
        if (score.userId && !best.has(score.userId)) best.set(score.userId, score);
    });
    return [...best.values()].sort(compareScores);
}

function publicEntry(score, position, currentUserId) {
    const profile = score.user?.profile;
    const isCurrentUser = Boolean(currentUserId && score.userId === currentUserId);
    const identityHidden = profile?.profileVisibility === 'PRIVATE' || profile?.showRhythmRanking === false;
    const revealIdentity = isCurrentUser || !identityHidden;
    return {
        accuracy: score.accuracy,
        achievedAt: score.createdAt,
        avatarUrl: revealIdentity ? profile?.avatarUrl || null : null,
        difficulty: score.difficulty,
        displayName: revealIdentity ? profile?.displayName || score.user?.name || 'Player' : 'Anonymous Player',
        grade: gradeFor(score),
        isCurrentUser,
        maxCombo: Number(score.maxCombo || 0),
        position,
        score: Number(score.score),
        songId: score.songId,
        songTitle: score.song?.title || 'Unknown Song',
        userId: revealIdentity ? score.userId : null,
    };
}

async function leaderboard({ currentUserId = null, difficulty, period = 'all-time', songId }) {
    const songs = await listLeaderboardSongs();
    const selectedSong = songId ? songs.find((song) => song.id === songId) : songs[0] || null;
    if (songId && !selectedSong) {
        const error = new Error('Published rhythm-game song not found.');
        error.statusCode = 404;
        error.code = 'LEADERBOARD_SONG_NOT_FOUND';
        throw error;
    }

    const availableDifficulties = selectedSong?.difficulties || [];
    const selectedDifficulty = difficulty || availableDifficulties[0] || null;
    const difficultyAvailable = Boolean(selectedDifficulty && availableDifficulties.includes(selectedDifficulty));
    if (!selectedSong || !difficultyAvailable) {
        return {
            availableDifficulties,
            currentUser: null,
            difficultyAvailable,
            entries: [],
            period,
            selectedDifficulty,
            selectedSong,
            songs,
            totalRankedPlayers: 0,
        };
    }

    const where = { difficulty: selectedDifficulty, songId: selectedSong.id };
    const start = periodStart(period);
    if (start) where.createdAt = { [Op.gte]: start };
    const ranked = bestScorePerUser(await loadOfficialScores(where));
    const entries = ranked.map((score, index) => publicEntry(score, index + 1, currentUserId));
    const currentUser = currentUserId ? entries.find((entry) => entry.isCurrentUser) || null : null;
    return {
        availableDifficulties,
        currentUser,
        difficultyAvailable: true,
        entries: entries.slice(0, 100),
        period,
        selectedDifficulty,
        selectedSong,
        songs,
        totalRankedPlayers: ranked.length,
    };
}

function compareBestRankCandidates(left, right) {
    if (left.position !== right.position) return left.position - right.position;
    if (numericAccuracy(right.accuracy) !== numericAccuracy(left.accuracy)) {
        return numericAccuracy(right.accuracy) - numericAccuracy(left.accuracy);
    }
    const achievedDifference = new Date(left.achievedAt).getTime() - new Date(right.achievedAt).getTime();
    if (achievedDifference) return achievedDifference;
    const songDifference = left.songTitle.localeCompare(right.songTitle);
    if (songDifference) return songDifference;
    const difficultyDifference = DIFFICULTIES.indexOf(left.difficulty) - DIFFICULTIES.indexOf(right.difficulty);
    if (difficultyDifference) return difficultyDifference;
    return String(left.scoreId).localeCompare(String(right.scoreId));
}

async function userRhythmSummary(userId) {
    const [songs, officialScores] = await Promise.all([
        listLeaderboardSongs(),
        loadOfficialScores(),
    ]);
    const eligibleCombinations = new Set(songs.flatMap((song) => song.difficulties.map((difficulty) => `${song.id}:${difficulty}`)));
    const eligibleScores = officialScores.filter((score) => eligibleCombinations.has(`${score.songId}:${score.difficulty}`));
    const scoresByChart = new Map();
    eligibleScores.forEach((score) => {
        const key = `${score.songId}:${score.difficulty}`;
        const chartScores = scoresByChart.get(key) || [];
        chartScores.push(score);
        scoresByChart.set(key, chartScores);
    });

    const candidates = [];
    const personalBests = [];
    scoresByChart.forEach((chartScores) => {
        const ranked = bestScorePerUser(chartScores);
        const index = ranked.findIndex((score) => score.userId === userId);
        if (index < 0) return;
        const score = ranked[index];
        personalBests.push(score);
        candidates.push({
            accuracy: score.accuracy,
            achievedAt: score.createdAt,
            difficulty: score.difficulty,
            grade: gradeFor(score),
            maxCombo: Number(score.maxCombo || 0),
            position: index + 1,
            score: Number(score.score),
            scoreId: score.id,
            songId: score.songId,
            songTitle: score.song?.title || 'Unknown Song',
            totalRankedPlayers: ranked.length,
        });
    });
    const bestLeaderboardRank = candidates.sort(compareBestRankCandidates)[0] || null;
    const userScores = eligibleScores.filter((score) => score.userId === userId);
    const topScores = personalBests
        .sort(compareScores)
        .slice(0, 3)
        .map((score) => ({
            accuracy: score.accuracy,
            createdAt: score.createdAt,
            difficulty: score.difficulty,
            id: score.id,
            maxCombo: Number(score.maxCombo || 0),
            rank: gradeFor(score),
            score: Number(score.score),
            song: {
                coverImageUrl: score.song?.coverImageUrl || null,
                id: score.songId,
                title: score.song?.title || 'Unknown Song',
            },
            songId: score.songId,
        }));
    return {
        bestLeaderboardRank,
        bestScore: topScores[0]?.score || 0,
        gamesCompleted: userScores.length,
        gamesPlayed: userScores.length,
        rank: bestLeaderboardRank?.position || null,
        topScores,
    };
}

module.exports = {
    DIFFICULTIES,
    PERIODS,
    bestScorePerUser,
    compareScores,
    leaderboard,
    listLeaderboardSongs,
    periodStart,
    userRhythmSummary,
};
