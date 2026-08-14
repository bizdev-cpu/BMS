export async function canAccessSpreadsheet(
  spreadsheetId,
  accessToken,
) {
  if (!spreadsheetId || !accessToken) {
    return false;
  }

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.ok;
  } catch (error) {
    console.error(
      'Spreadsheet 권한 확인 실패:',
      spreadsheetId,
      error,
    );

    return false;
  }
}


export async function filterAccessibleSources(
  sources,
  accessToken,
) {
  if (!Array.isArray(sources) || !accessToken) {
    return [];
  }

  const results = await Promise.all(
    sources.map(async (source) => {
      const accessible = await canAccessSpreadsheet(
        source.spreadsheetId,
        accessToken,
      );

      return accessible ? source : null;
    }),
  );

  return results.filter(Boolean);
}