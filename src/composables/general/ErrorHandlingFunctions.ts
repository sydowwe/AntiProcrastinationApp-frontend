import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const { showErrorSnackbar } = useSnackbar();
export function handleHttpCodes(statusCode: number){
    switch (statusCode) {
        case 400:
            showErrorSnackbar('Požiadavka obsahuje nesprávne údaje.');
            console.error('BadRequestError');
            break
        case 401:
            showErrorSnackbar('Pre túto akciu sa vyžaduje prihlásenie.');
            console.error('UnauthorizedError');
            break;
        case 403:
            showErrorSnackbar('Nemáte oprávnenie na vykonanie tejto akcie.');
            console.error('ForbiddenError');
            break;
        case 404:
            showErrorSnackbar('Požadovaná položka nebola nájdená.');
            console.error('NotFoundError');
            break;
        case 409:
            showErrorSnackbar('Zistený konflikt údajov. Akcia nemohla byť dokončená.');
            console.error('ConflictError');
            break;
        case 500:
            showErrorSnackbar('Na strane servera sa vyskytla chyba. Skúste to prosím neskôr.');
            console.error('InternalServerError');
            break;
        case 503:
            showErrorSnackbar('Služba je dočasne nedostupná. Skúste to prosím neskôr.');
            console.error('ServiceUnavailableError');
            break;
        case 504:
            showErrorSnackbar('Server neodpovedá včas. Skúste to prosím neskôr.');
            console.error('GatewayTimeoutError');
            break;

        // Cases 405 and 406 are usually developer errors, so a generic message is often best.
        case 405:
            showErrorSnackbar('Vyskytla sa neočakávaná chyba.');
            console.error('MethodNotAllowedError');
            break;
        case 406:
            showErrorSnackbar('Vyskytla sa neočakávaná chyba.');
            console.error('NotAcceptableError');
            break;

        default:
            showErrorSnackbar('Vyskytla sa neznáma chyba. Kontaktujte podporu.');
            console.error(`UnhandledHttpError: ${statusCode}`);
            break;
    }
}