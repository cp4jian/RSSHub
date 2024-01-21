const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

const baseUrl = 'https://higedan.com/information';
const logoImageUrl = 'https://play-lh.googleusercontent.com/6Oq-CDYM4xH-_q_dOfX7nU8SjtqlIMwwjBbNxR1QqS7KdvnGOk-ITtcRdlKsvfcNF1E';

module.exports = async (ctx) => {
    let maxPages = Number(ctx.params.maxPages);
    if (Number.isNaN(maxPages) || maxPages < 1) {
        maxPages = 1;
    }

    let pages = await Promise.all(
        [...Array(maxPages).keys()].map((index) =>
            got(`${baseUrl}/page/${index + 1}`, {
                headers: {
                    Referer: 'https://higedan.com/information/',
                },
            })
        )
    );
    pages = pages.map((page) => page.data);

    const items = [];
    const topicsItems = new Set();
    for (const page of pages) {
        const $ = cheerio.load(page);
        const pageItems = $('#infomatiomn .pageContents')
            .toArray()
            .map((item) => {
                const title = $(item).find('div.InfoTitle p').text();
                const updatedDate = parseDate($(item).find('div.InfoDay span').text());
                const description = $(item).children('div.InfoSentence').html();
                const isTopics = $(item).children('div.InfoCategoryFlex').children('.InfoCategory').length > 1;

                const result = {
                    title,
                    pubDate: updatedDate,
                    updated: updatedDate,
                    description,
                    link: baseUrl,
                    itunes_item_image: logoImageUrl,
                };
                const json = JSON.stringify(result);
                result.guid = json;

                if (isTopics) {
                    if (topicsItems.has(json)) {
                        return {};
                    } else {
                        topicsItems.add(json);
                        return result;
                    }
                } else {
                    return result;
                }
            });
        items.push(pageItems);
    }

    ctx.state.data = {
        title: 'Official髭男dism Information',
        link: baseUrl,
        item: items.flat().filter((value) => Object.keys(value).length !== 0),
        image: logoImageUrl,
        language: 'ja',
        allowEmpty: true,
    };
};
