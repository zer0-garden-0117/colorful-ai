import { useEffect, useState } from 'react';
import { useAccessToken } from './useAccessToken';
import {
  UserTokenGetHeader, useUsersTokenGet, UserTokenGetResult
} from '../openapi/users/useUsersTokenGet';
import {
  getUserTokenFromCookies, setUserTokenToCookies
} from '../../utils/authCookies';
import { decodeUserToken } from '../../utils/authJwt';
import { useError } from "../../providers/error/errorProvider";

export const useUserToken = () => {
  const initialUserToken = getUserTokenFromCookies();
  const { userId: initialUserId, role: initialRole } = decodeUserToken(initialUserToken || '');
  const [userToken, setUserToken] = useState<string | null>(initialUserToken);
  const [userId, setUserId] = useState<number | null>(Number(initialUserId));
  const [isAdmin, setIsAdmin] = useState<boolean>(initialRole == 'admin');
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const { accessToken, isAuthenticated } = useAccessToken();
  const { setError } = useError();
  const [isDeleting, setIsDeleting] = useState(false);

  // `accessToken` がある場合にのみ `useUsersTokenGet` を実行
  const userTokenHeaders: UserTokenGetHeader = { "x-access-token": `${accessToken}` };
  const { data, error } = useUsersTokenGet(userTokenHeaders, {
    fallbackData: null as unknown as UserTokenGetResult,
  });

  useEffect(() => {
    if (error) {
      setError("Error fetching user token");
    }

    if (data?.userToken) {
      const { userId, role } = decodeUserToken(data.userToken);
      const isAdmin = role == "admin"
      setUserToken(data.userToken);
      setUserId(Number(userId));
      setIsAdmin(isAdmin);
      setUserTokenToCookies(data.userToken);
    }
  }, [data, error, setError, isAuthenticated, accessToken]);

  return { isSetup, userToken, userId, isAdmin, error, isDeleting, setIsDeleting };
};