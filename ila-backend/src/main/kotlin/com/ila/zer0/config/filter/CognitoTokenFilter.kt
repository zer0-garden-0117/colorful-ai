package com.ila.zer0.config.filter

import com.ila.zer0.config.token.CustomAuthenticationToken
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtException
import org.springframework.web.filter.OncePerRequestFilter

class CognitoTokenFilter(
    private val cognitoJwtDecoder: JwtDecoder?,
    private val noBearerTokenPathSet: Set<String>
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: jakarta.servlet.http.HttpServletRequest,
        response: jakarta.servlet.http.HttpServletResponse,
        filterChain: jakarta.servlet.FilterChain
    ) {
        val requestURI = request.requestURI
        if (requestURI in noBearerTokenPathSet) {
            logger.info(requestURI)
            val token = request.getHeader("x-access-token")
            logger.info(token)
            if (token != null) {
                try {
                    // JWT検証
                    val jwt = cognitoJwtDecoder?.decode(token)
                    val username = jwt?.getClaimAsString("username")
                    logger.info("JWT Username: $username")

                    val customAuthentication = CustomAuthenticationToken(
                        userId = username
                    )
                    SecurityContextHolder.getContext().authentication =
                        customAuthentication
                } catch (e: JwtException) {
                    SecurityContextHolder.clearContext()
                    // エラーレスポンスを設定
                    response.status = HttpServletResponse.SC_UNAUTHORIZED
                    response.contentType = "application/json"
                    response.characterEncoding = "UTF-8"
                    response.writer.write("""{"error": "Invalid or expired token"}""")
                    return
                }
            }
        }
        filterChain.doFilter(request, response)
    }
}