const { createSearchService } = require('../../src/search/search-service');
const { ValidationError } = require('../../src/errors');

const found = {
  songs: [{ id: '1', title: 'Luz', coverUrl: 'javascript:x', artists: [] }],
  albums: [
    { id: '2', title: 'Luz de Neón', coverUrl: 'https://coverartarchive.org/a', artists: [] },
  ],
  artists: [{ id: '3', name: 'Luzia', imageUrl: 'http://x.test/a.jpg' }],
  users: [{ username: 'luz', name: 'Luz', photoUrl: null }],
  communities: [{ id: '4', name: 'Luces', access: 'public', membersCount: 3 }],
};

test('test_PA_03_01_search_returnsCategoriesWithSafeImages', async () => {
  const searchRepository = { search: jest.fn().mockResolvedValue(found) };
  const service = createSearchService({ searchRepository });

  const result = await service.search(' luz ', '7');

  expect(result.query).toBe('luz');
  expect(result.songs[0].coverUrl).toBeNull();
  expect(result.albums[0].coverUrl).toBe('https://coverartarchive.org/a');
  expect(result.artists[0].imageUrl).toBeNull();
  expect(result.users).toEqual([{ username: 'luz', name: 'Luz', photoUrl: null }]);
  expect(result.communities).toHaveLength(1);
  expect(searchRepository.search).toHaveBeenCalledWith(expect.objectContaining({ exact: 'luz' }), {
    limit: 10,
    viewerId: '7',
  });
});

test('test_search_withInvalidTerm_throwsWithoutQuerying', async () => {
  const searchRepository = { search: jest.fn() };
  const service = createSearchService({ searchRepository });

  await expect(service.search('a', null)).rejects.toBeInstanceOf(ValidationError);
  expect(searchRepository.search).not.toHaveBeenCalled();
});
